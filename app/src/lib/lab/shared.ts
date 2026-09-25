// Types and question builders shared by the lab UI and its API routes.
import type { JevQuestions } from "@/lib/jev/types";

export const LABELS = ["very_negative", "negative", "neutral", "positive", "very_positive"] as const;
export type Label = (typeof LABELS)[number];
export const LABEL_DISPLAY: Record<Label, string> = {
  very_negative: "Very Negative",
  negative: "Negative",
  neutral: "Neutral",
  positive: "Positive",
  very_positive: "Very Positive",
};

export type SentimentResult = {
  label: Label;
  stars: number;
  confidence: number;
  probabilities: Record<Label, number>;
  score?: number;
};

export type JevSentimentResponse = SentimentResult & {
  provider: string;
  model: string;
  /** Next server → JEV → Next server */
  upstream_ms: number;
  usage: { input_tokens: number; output_tokens: number };
  cost_usd?: number;
};

export type BertSentimentResponse = SentimentResult & {
  model: string;
  device: string;
  /** Next server → BERT service → Next server */
  upstream_ms: number;
  /** Only the local bert-service reports these; the hosted HF API doesn't. */
  timings: { tokenize_ms: number; inference_ms: number; total_ms: number } | null;
};

export type AspectResult = { name: string; mentioned: number; score: number | null; confidence: number | null };

export const MAX_TEXT = 4000;
export const DEFAULT_ASPECTS = ["camera", "battery", "display", "design", "performance", "build quality", "value for money"];

/** Same 5 classes as Moodify's BERT (nlptown 1–5 stars) so results are directly comparable. */
export function sentimentQuestions(): JevQuestions {
  return {
    sentiment: {
      type: "choice",
      instructions: "What is the overall sentiment of this product review? Answer as the star rating the reviewer would most likely give.",
      criteria: {
        very_negative: "1 star: strongly negative, angry, wants a refund or calls it a waste",
        negative: "2 stars: mostly negative with minor positives",
        neutral: "3 stars: mixed or average, neither good nor bad",
        positive: "4 stars: mostly positive with minor complaints",
        very_positive: "5 stars: strongly positive, delighted, highly recommends",
      },
    },
  };
}

export const aspectKey = (a: string) => a.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export function aspectQuestions(aspects: string[]): JevQuestions {
  const q: JevQuestions = {};
  for (const a of aspects) {
    const k = aspectKey(a);
    q[`${k}__mentioned`] = {
      type: "noul",
      instructions: `Does the reviewer describe an opinion or experience about the ${a}?`,
    };
    q[`${k}__rating`] = {
      type: "score",
      instructions: `How satisfied is the reviewer with the ${a}?`,
      criteria: ["very unhappy", "unhappy", "neutral", "happy", "very happy"],
    };
  }
  return q;
}

export function starsToLabel(stars: number): Label {
  return LABELS[Math.min(4, Math.max(0, Math.round(stars) - 1))];
}
