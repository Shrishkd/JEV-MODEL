// Where the BERT side of the comparison runs.
//   service → your own bert-service (local dev: real forward-pass timings)
//   hf      → Hugging Face's hosted copy of the same model (production: nothing to host)
// BERT_SERVICE_URL wins when both are set.

export const BERT_MODEL_ID = "nlptown/bert-base-multilingual-uncased-sentiment";

export type BertBackend = { kind: "service"; url: string } | { kind: "hf"; token: string } | { kind: "none" };

export function bertBackend(): BertBackend {
  const url = process.env.BERT_SERVICE_URL?.trim().replace(/\/$/, "");
  if (url) return { kind: "service", url };
  const token = process.env.HF_TOKEN?.trim();
  if (token) return { kind: "hf", token };
  return { kind: "none" };
}
