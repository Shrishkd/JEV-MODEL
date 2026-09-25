// Per-visitor JEV quota: N "tries" per day, where a try is one user action (a race, an aspects
// run, or one whole benchmark run). The browser sends a run id with every JEV call; the server
// counts distinct run ids per IP per day, caps calls per run, and caps total calls per day.
//
// Storage: Upstash Redis via REST when configured (survives Vercel's serverless instances),
// otherwise in-memory (fine locally; best-effort on Vercel because instances don't share memory).

const DAY = 86_400;

// Read on every call so env changes apply without a code reload.
const num = (v: string | undefined, d: number) => (v !== undefined && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : d);
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
};

export type QuotaStatus = { limit: number; used: number; remaining: number; maxCallsPerTry: number; unlimited: boolean };
export type Verdict = { ok: true; status: QuotaStatus } | { ok: false; code: string; message: string; status: QuotaStatus };

// ---------------- storage ----------------

type Cmd = (string | number)[];
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

async function redis(cmds: Cmd[]): Promise<unknown[]> {
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`quota store error ${res.status}`);
  return ((await res.json()) as { result: unknown }[]).map((r) => r.result);
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
    if (REDIS_URL && REDIS_TOKEN) {
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
    if (REDIS_URL && REDIS_TOKEN) await redis([["SREM", key, member]]);
    else memGet(key)?.set?.delete(member);
  },
  async scard(key: string): Promise<number> {
    if (REDIS_URL && REDIS_TOKEN) return (await redis([["SCARD", key]]))[0] as number;
    return memGet(key)?.set?.size ?? 0;
  },
  async incr(key: string, ttl: number): Promise<number> {
    if (REDIS_URL && REDIS_TOKEN) return (await redis([["INCR", key], ["EXPIRE", key, ttl]]))[0] as number;
    const e = memEntry(key, ttl);
    e.n = (e.n ?? 0) + 1;
    return e.n;
  },
};

// ---------------- policy ----------------

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

const today = () => new Date().toISOString().slice(0, 10);
const triesKey = (ip: string) => `jev:tries:${today()}:${ip}`;

function status(used: number): QuotaStatus {
  const unlimited = QUOTA.triesPerDay <= 0;
  const limit = unlimited ? Infinity : QUOTA.triesPerDay;
  return { limit, used, remaining: unlimited ? Infinity : Math.max(0, limit - used), maxCallsPerTry: QUOTA.maxCallsPerTry, unlimited };
}

export async function peekQuota(req: Request): Promise<QuotaStatus> {
  if (QUOTA.triesPerDay <= 0) return status(0);
  return status(await store.scard(triesKey(clientIp(req))));
}

/** Call once per JEV API call, before calling the provider. */
export async function consumeJevCall(req: Request, rawRunId: string | null): Promise<Verdict> {
  const runId = rawRunId && /^[A-Za-z0-9-]{8,64}$/.test(rawRunId) ? rawRunId : crypto.randomUUID();
  const ip = clientIp(req);
  let used = 0;

  if (QUOTA.triesPerDay > 0) {
    const key = triesKey(ip);
    const { added, size } = await store.sadd(key, runId, 2 * DAY);
    used = size;
    if (added && size > QUOTA.triesPerDay) {
      await store.srem(key, runId);
      return {
        ok: false,
        code: "quota_exhausted",
        message: `You've used all ${QUOTA.triesPerDay} JEV tries for today. BERT stays unlimited, and your tries reset tomorrow (UTC).`,
        status: status(size - 1),
      };
    }
    const calls = await store.incr(`jev:run:${ip}:${runId}`, 2 * DAY);
    if (calls > QUOTA.maxCallsPerTry) {
      return { ok: false, code: "run_cap", message: `One try covers at most ${QUOTA.maxCallsPerTry} JEV calls.`, status: status(size) };
    }
  }

  if (QUOTA.globalDailyCalls > 0 && (await store.incr(`jev:global:${today()}`, 2 * DAY)) > QUOTA.globalDailyCalls) {
    return { ok: false, code: "global_cap", message: "The demo's daily JEV budget is used up. Please try again tomorrow.", status: status(used) };
  }
  return { ok: true, status: status(used) };
}

export const quotaHeaders = (s: QuotaStatus): Record<string, string> =>
  s.unlimited ? {} : { "x-jev-tries-remaining": String(s.remaining), "x-jev-tries-limit": String(s.limit) };
