// The app's only rate-limiting layer: fixed-window daily quotas, enforced server-side, keyed by IP,
// with a site-wide daily ceiling that bounds the bill no matter how many IPs show up.
//
//   JEV  (costs money): N tries / visitor / day. A try = one user action (race, aspects run, or one
//                       whole benchmark run), identified by a run id the browser sends. Each try is
//                       capped at M calls; the whole site at G calls/day. A try that fails at the
//                       provider is refunded.
//   BERT (HF credits):  only when running on Hugging Face: calls / visitor / day + site-wide cap.
//                       The local bert-service is never limited.
//
// Counts live in Upstash Redis (shared by every Vercel instance). In production without Redis the
// app FAILS CLOSED: paid calls are refused rather than silently unlimited. Locally, memory is used.

const DAY = 86_400;

const num = (v: string | undefined, d: number) => (v !== undefined && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : d);
// Getters: read env on every call so changes apply without a code reload.
export const QUOTA = {
  get triesPerDay() {
    return num(process.env.JEV_TRIES_PER_DAY, 3); // 0 = unlimited
  },
  get maxCallsPerTry() {
    return num(process.env.JEV_MAX_CALLS_PER_TRY, 40);
  },
  get globalDailyCalls() {
    return num(process.env.JEV_GLOBAL_DAILY_CALLS, 500);
  },
  get bertCallsPerDay() {
    return num(process.env.BERT_CALLS_PER_DAY, 200);
  },
  get bertGlobalDailyCalls() {
    return num(process.env.BERT_GLOBAL_DAILY_CALLS, 2000);
  },
};

export type QuotaStatus = { limit: number; used: number; remaining: number; maxCallsPerTry: number; unlimited: boolean };
type Denied = { ok: false; httpStatus: 429 | 503; code: string; message: string };
export type Verdict = ({ ok: true; runId: string; newTry: boolean } | Denied) & { status: QuotaStatus };

// ---------------- storage ----------------

type Cmd = (string | number)[];
const redisUrl = () => (process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL)?.trim();
const redisToken = () => (process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN)?.trim();
const hasRedis = () => Boolean(redisUrl() && redisToken());
/** Production (Vercel) must use Redis: in-memory counts aren't shared between serverless instances. */
const storeMissing = () => !hasRedis() && (process.env.VERCEL === "1" || process.env.QUOTA_REQUIRE_STORE === "1");

async function redis(cmds: Cmd[]): Promise<unknown[]> {
  const res = await fetch(`${redisUrl()}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${redisToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`quota store error ${res.status}`);
  const out = (await res.json()) as { result?: unknown; error?: string }[];
  const failed = out.find((r) => r.error);
  if (failed) throw new Error(`quota store error: ${failed.error}`);
  return out.map((r) => r.result);
}

const mem = new Map<string, { set?: Set<string>; n?: number; exp: number }>();
function memGet(key: string) {
  const e = mem.get(key);
  if (e && e.exp < Date.now()) {
    mem.delete(key);
    return undefined;
  }
  return e;
}
function memEntry(key: string, ttl: number) {
  let e = memGet(key);
  if (!e) {
    e = { exp: Date.now() + ttl * 1000 };
    mem.set(key, e);
  }
  return e;
}

const store = {
  async sadd(key: string, member: string, ttl: number): Promise<{ added: boolean; size: number }> {
    if (hasRedis()) {
      const [added, size] = (await redis([["SADD", key, member], ["SCARD", key], ["EXPIRE", key, ttl]])) as number[];
      return { added: added === 1, size };
    }
    const e = memEntry(key, ttl);
    e.set ??= new Set();
    const added = !e.set.has(member);
    e.set.add(member);
    return { added, size: e.set.size };
  },
  async srem(key: string, member: string) {
    if (hasRedis()) await redis([["SREM", key, member]]);
    else memGet(key)?.set?.delete(member);
  },
  async scard(key: string): Promise<number> {
    if (hasRedis()) return (await redis([["SCARD", key]]))[0] as number;
    return memGet(key)?.set?.size ?? 0;
  },
  async incr(key: string, ttl: number): Promise<number> {
    if (hasRedis()) return (await redis([["INCR", key], ["EXPIRE", key, ttl]]))[0] as number;
    const e = memEntry(key, ttl);
    e.n = (e.n ?? 0) + 1;
    return e.n;
  },
};

// ---------------- policy ----------------

/** On Vercel, x-real-ip is set by the platform and can't be spoofed by the client. */
export function clientIp(req: Request) {
  return req.headers.get("x-real-ip")?.trim() || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

const today = () => new Date().toISOString().slice(0, 10);
const triesKey = (ip: string) => `jev:tries:${today()}:${ip}`;

function status(used: number): QuotaStatus {
  const unlimited = QUOTA.triesPerDay <= 0;
  const limit = unlimited ? Infinity : QUOTA.triesPerDay;
  return { limit, used, remaining: unlimited ? Infinity : Math.max(0, limit - used), maxCallsPerTry: QUOTA.maxCallsPerTry, unlimited };
}

const STORE_MISSING: Omit<Denied, "ok"> = {
  httpStatus: 503,
  code: "store_missing",
  message: "Usage limits need a shared store in production. Add Upstash Redis to this Vercel project, then redeploy.",
};

export async function peekQuota(req: Request): Promise<QuotaStatus & { storeMissing: boolean }> {
  if (storeMissing()) return { ...status(QUOTA.triesPerDay), storeMissing: true };
  if (QUOTA.triesPerDay <= 0) return { ...status(0), storeMissing: false };
  return { ...status(await store.scard(triesKey(clientIp(req)))), storeMissing: false };
}

/** Call once per JEV API call, before calling the provider. */
export async function consumeJevCall(req: Request, rawRunId: string | null): Promise<Verdict> {
  const runId = rawRunId && /^[A-Za-z0-9-]{8,64}$/.test(rawRunId) ? rawRunId : crypto.randomUUID();
  if (storeMissing()) return { ok: false, ...STORE_MISSING, status: status(0) };

  const ip = clientIp(req);
  let used = 0;
  let newTry = false;

  if (QUOTA.triesPerDay > 0) {
    const key = triesKey(ip);
    const { added, size } = await store.sadd(key, runId, 2 * DAY);
    used = size;
    newTry = added;
    if (added && size > QUOTA.triesPerDay) {
      await store.srem(key, runId);
      return {
        ok: false,
        httpStatus: 429,
        code: "quota_exhausted",
        message: `You've used all ${QUOTA.triesPerDay} JEV tries for today. BERT still works, and your tries reset at midnight UTC.`,
        status: status(size - 1),
      };
    }
    const calls = await store.incr(`jev:run:${ip}:${runId}`, 2 * DAY);
    if (calls > QUOTA.maxCallsPerTry) {
      return { ok: false, httpStatus: 429, code: "run_cap", message: `One try covers at most ${QUOTA.maxCallsPerTry} JEV calls.`, status: status(size) };
    }
  }

  if (QUOTA.globalDailyCalls > 0 && (await store.incr(`jev:global:${today()}`, 2 * DAY)) > QUOTA.globalDailyCalls) {
    if (newTry) await store.srem(triesKey(ip), runId);
    return { ok: false, httpStatus: 429, code: "global_cap", message: "The demo's daily JEV budget is used up. It resets at midnight UTC.", status: status(used - (newTry ? 1 : 0)) };
  }
  return { ok: true, runId, newTry, status: status(used) };
}

/** Give a try back when the provider failed on its first call. The visitor got nothing for it. */
export async function refundJevTry(req: Request, runId: string): Promise<QuotaStatus> {
  if (QUOTA.triesPerDay <= 0) return status(0);
  const key = triesKey(clientIp(req));
  await store.srem(key, runId);
  return status(await store.scard(key));
}

/** Hosted BERT (Hugging Face credits) only. */
export async function consumeBertCall(req: Request): Promise<{ ok: true } | Denied> {
  if (storeMissing()) return { ok: false, ...STORE_MISSING };
  const ip = clientIp(req);
  if (QUOTA.bertCallsPerDay > 0 && (await store.incr(`bert:ip:${today()}:${ip}`, 2 * DAY)) > QUOTA.bertCallsPerDay)
    return { ok: false, httpStatus: 429, code: "bert_quota", message: `BERT is limited to ${QUOTA.bertCallsPerDay} calls per visitor per day on this demo.` };
  if (QUOTA.bertGlobalDailyCalls > 0 && (await store.incr(`bert:global:${today()}`, 2 * DAY)) > QUOTA.bertGlobalDailyCalls)
    return { ok: false, httpStatus: 429, code: "bert_global_cap", message: "The demo's daily BERT budget is used up. It resets at midnight UTC." };
  return { ok: true };
}

export const quotaHeaders = (s: QuotaStatus): Record<string, string> =>
  s.unlimited ? {} : { "x-jev-tries-remaining": String(s.remaining), "x-jev-tries-limit": String(s.limit) };
