/**
 * Pseudo-JEV: a tiny, deterministic imitation of JEV's *interface* used by the
 * educational blog demos. It is NOT the real model — it scores options with
 * keyword overlap + a sentiment lexicon, then softmaxes. What it faithfully
 * imitates is the contract: state + typed questions in → a probability for
 * every option out, always one of the options you supplied.
 */

export type Option = { key: string; label: string; keywords?: string[] };

export type ChoiceAnswer = {
  type: "choice";
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
};

// Seeded PRNG so the same input always gives the same "model" output.
export function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const tokenize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9ऀ-ॿ\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);

function softmax(xs: number[], temperature = 1) {
  const m = Math.max(...xs);
  const e = xs.map((x) => Math.exp((x - m) / temperature));
  const z = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / z);
}

const round = (x: number, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

/** Choice question: pick one of the given options. */
export function simulateChoice(state: string, options: Option[]): ChoiceAnswer {
  const words = tokenize(state);
  const text = " " + words.join(" ") + " ";
  const rand = mulberry32(hashString(state + options.map((o) => o.key).join("|")));

  const logits = options.map((o) => {
    const kws = [...(o.keywords ?? []), ...tokenize(o.label)];
    let hits = 0;
    for (const k of kws) {
      const kw = k.toLowerCase();
      if (kw.includes(" ") ? text.includes(" " + kw + " ") : words.some((w) => w.startsWith(kw))) hits += 1;
    }
    return hits * 2.2 + rand() * 0.6;
  });
  const probs = softmax(logits, 0.9);
  const map: Record<string, number> = {};
  options.forEach((o, i) => (map[o.key] = round(probs[i])));
  const best = options[probs.indexOf(Math.max(...probs))];
  const sorted = [...probs].sort((a, b) => b - a);
  // Confidence tracks the margin between the top-2 options.
  const confidence = round(Math.min(0.99, 0.35 + (sorted[0] - (sorted[1] ?? 0)) * 0.75 + sorted[0] * 0.15));
  return { type: "choice", choice: best.key, confidence, probabilities: map };
}

// --- Sentiment ------------------------------------------------------------

const POS = [
  "love", "loved", "amazing", "awesome", "great", "excellent", "best", "perfect", "fantastic", "good",
  "smooth", "fast", "bright", "crisp", "premium", "worth", "happy", "superb", "brilliant", "nice", "solid",
  "impressive", "beautiful", "recommend", "badhiya", "mast", "zabardast", "accha", "achha", "shandaar",
];
const NEG = [
  "hate", "worst", "terrible", "awful", "bad", "poor", "broken", "damaged", "slow", "lag", "laggy", "heats",
  "heating", "hot", "drains", "blurry", "refund", "angry", "disappointed", "waste", "useless", "cheap",
  "flimsy", "crash", "crashes", "never", "bekaar", "bakwas", "ghatiya", "late", "scratch", "noisy",
];
const INTENS = ["very", "super", "extremely", "really", "totally", "bahut", "absolutely", "so"];
const NEGATORS = ["not", "no", "never", "isn't", "wasn't", "don't", "didn't", "nahi", "nahin"];

/** Sentiment score in roughly [-1, 1] from a small lexicon (imitation only). */
export function lexiconSentiment(text: string) {
  const w = tokenize(text);
  let s = 0;
  let hits = 0;
  for (let i = 0; i < w.length; i++) {
    const t = w[i];
    let v = POS.some((p) => t.startsWith(p)) ? 1 : NEG.some((n) => t.startsWith(n)) ? -1 : 0;
    if (!v) continue;
    if (INTENS.includes(w[i - 1])) v *= 1.6;
    if (NEGATORS.includes(w[i - 1]) || NEGATORS.includes(w[i - 2])) v *= -0.8;
    s += v;
    hits++;
  }
  const exclaim = (text.match(/!/g) ?? []).length;
  const val = hits ? s / Math.sqrt(hits + 1) : 0;
  return Math.max(-1, Math.min(1, val * 0.75 + Math.sign(val) * Math.min(exclaim, 3) * 0.05));
}

export const SENTIMENT_LABELS = ["very_negative", "negative", "neutral", "positive", "very_positive"] as const;
export type SentimentLabel = (typeof SENTIMENT_LABELS)[number];

/** 5-class sentiment distribution centred on the lexicon score. */
export function simulateSentiment(text: string) {
  const v = lexiconSentiment(text); // -1..1
  const center = (v + 1) * 2; // 0..4
  const rand = mulberry32(hashString(text));
  const logits = SENTIMENT_LABELS.map((_, i) => -((i - center) ** 2) / 0.9 + rand() * 0.15);
  const probs = softmax(logits);
  const idx = probs.indexOf(Math.max(...probs));
  const probabilities = Object.fromEntries(SENTIMENT_LABELS.map((k, i) => [k, round(probs[i], 3)])) as Record<
    SentimentLabel,
    number
  >;
  return {
    label: SENTIMENT_LABELS[idx],
    stars: idx + 1,
    score: round(probs.reduce((a, p, i) => a + p * (i + 1), 0), 2),
    confidence: round(probs[idx], 3),
    probabilities,
  };
}

// --- Latency models (drawn from figures quoted in the video / by TypeSafe) --

/** JEV: 70–500 ms end-to-end, skewed towards the low end. */
export function sampleJevLatency(rand = Math.random) {
  const u = rand();
  return Math.round(90 + 420 * u * u + rand() * 40);
}

/** Frontier LLM with structured output: ~3–8 s for a small classification. */
export function sampleLlmLatency(rand = Math.random) {
  return Math.round(2800 + rand() * 4200 + (rand() < 0.15 ? rand() * 3000 : 0));
}
