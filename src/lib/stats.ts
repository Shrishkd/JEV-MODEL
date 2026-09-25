export function percentile(values: number[], p: number) {
  if (!values.length) return NaN;
  const s = [...values].sort((a, b) => a - b);
  const idx = (s.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

/** Multi-class Brier score: mean over items of Σ_k (p_k − y_k)². 0 is perfect, 2 is worst. */
export function brierScore(items: { probs: number[]; truth: number }[]) {
  return mean(items.map(({ probs, truth }) => probs.reduce((a, p, k) => a + (p - (k === truth ? 1 : 0)) ** 2, 0)));
}

export type Bin = { lo: number; hi: number; count: number; avgConf: number; accuracy: number };

/** Reliability diagram bins (top-label calibration). */
export function reliabilityBins(items: { confidence: number; correct: boolean }[], nBins = 5): Bin[] {
  const bins: Bin[] = Array.from({ length: nBins }, (_, i) => ({
    lo: i / nBins,
    hi: (i + 1) / nBins,
    count: 0,
    avgConf: 0,
    accuracy: 0,
  }));
  for (const it of items) {
    const b = bins[Math.min(nBins - 1, Math.floor(it.confidence * nBins))];
    b.count++;
    b.avgConf += it.confidence;
    b.accuracy += it.correct ? 1 : 0;
  }
  for (const b of bins) {
    if (b.count) {
      b.avgConf /= b.count;
      b.accuracy /= b.count;
    }
  }
  return bins;
}

/** Expected calibration error: weighted gap between confidence and accuracy. */
export function ece(bins: Bin[]) {
  const n = bins.reduce((a, b) => a + b.count, 0);
  return n ? bins.reduce((a, b) => a + (b.count / n) * Math.abs(b.avgConf - b.accuracy), 0) : NaN;
}
