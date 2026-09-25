// Minimal in-memory sliding-window limiter — enough to stop a public deploy of the lab
// from being used as a free JEV proxy. (Per server instance; use Redis/Upstash for real scale.)
const hits = new Map<string, number[]>();

export function rateLimit(req: Request, limit = Number(process.env.LAB_RATE_LIMIT_PER_MIN ?? 300)) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length <= limit;
}

export const tooMany = () => Response.json({ error: "Rate limit exceeded — slow down a little." }, { status: 429 });
