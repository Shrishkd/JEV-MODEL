// TypeSafe /v1/systemone request & response shapes (as documented by TypeSafe and Vercel AI Gateway).

export type NoulQuestion = { type: "noul"; instructions: string; criteria?: { true: string; false: string } };
export type ChoiceQuestion = { type: "choice"; instructions: string; criteria: Record<string, string> };
export type ScoreQuestion = { type: "score"; instructions: string; criteria: string[] };
export type JevQuestion = NoulQuestion | ChoiceQuestion | ScoreQuestion;
export type JevQuestions = Record<string, JevQuestion>;

export type NoulAnswer = { type: "noul"; noul: number };
export type ChoiceAnswer = { type: "choice"; choice: string; confidence?: number; probabilities: Record<string, number> };
export type ScoreAnswer = {
  type: "score";
  score: number;
  confidence?: number;
  probabilities: Record<string, number>;
  legend?: Record<string, string>;
};
export type JevAnswer = NoulAnswer | ChoiceAnswer | ScoreAnswer;

export type ProviderId = "typesafe" | "vercel" | "mock";
export type ProviderInfo = { id: ProviderId; model: string; configured: boolean };

export type JevResponse = {
  model: string;
  answers: Record<string, JevAnswer>;
  usage: { input_tokens: number; output_tokens: number };
  provider: ProviderId;
  /** Server → JEV → server round trip, measured in our API route. */
  latency_ms: number;
  cost_usd?: number;
};
