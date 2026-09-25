// Curated from github.com/walidboulanouar/awesome-jev-use-cases (74 demos, ranked by engagement).
// "decision" shows the typed question that powers each demo — the JEV-shaped core of the idea.

export type UseCaseCategory =
  | "Content & growth"
  | "Apps & tools"
  | "Agents & computer use"
  | "Triage & routing"
  | "Games & real time"
  | "Research & data"
  | "Trading & markets";

export const CATEGORY_COUNTS: Record<UseCaseCategory, number> = {
  "Content & growth": 18,
  "Apps & tools": 17,
  "Agents & computer use": 14,
  "Triage & routing": 9,
  "Games & real time": 7,
  "Research & data": 7,
  "Trading & markets": 2,
};

export type UseCase = {
  title: string;
  author: string;
  category: UseCaseCategory;
  blurb: string;
  metric?: string;
  decision: { state: string; question: string; answer: string };
  url: string;
  likes: number;
};

export const USE_CASES: UseCase[] = [
  {
    title: "Instant compaction for Claude",
    author: "@tamarajtran",
    category: "Apps & tools",
    blurb: "A Claude Code plugin that scores every tool call in the context window for whether it must be preserved — context compaction in milliseconds.",
    decision: { state: "tool call #214: grep output, 3k tokens", question: "Keep this in context?", answer: "noul 0.08 → drop" },
    url: "https://x.com/tamarajtran/status/2100694549362553153",
    likes: 10435,
  },
  {
    title: "Flight search with Browser Use",
    author: "@gregpr07",
    category: "Agents & computer use",
    blurb: "A browser agent books Zurich → London by making each click/type decision with JEV instead of a slow LLM step. The whole flow runs in seconds.",
    metric: "~7 s end-to-end",
    decision: { state: "page DOM + goal", question: "Which element next?", answer: "choice: #search-btn" },
    url: "https://x.com/gregpr07/status/2100411066966749359",
    likes: 8723,
  },
  {
    title: "Real-time slop detector",
    author: "@RBilgil",
    category: "Content & growth",
    blurb: "A browser plugin that scores every post in your feed as you scroll and banners the AI slop in red.",
    decision: { state: "LinkedIn post text", question: "Is this AI slop?", answer: "noul 0.91 → red banner" },
    url: "https://x.com/RBilgil/status/2100976648552169805",
    likes: 7180,
  },
  {
    title: "724 competitor ads analysed",
    author: "@TheMattBerman",
    category: "Content & growth",
    blurb: "Systematic breakdown of a competitor's ad library — hook type, offer, angle — in one pass.",
    metric: "724 ads",
    decision: { state: "ad copy", question: "Hook type?", answer: "choice: social-proof" },
    url: "https://x.com/TheMattBerman/status/2100654891756589230",
    likes: 6348,
  },
  {
    title: "Voice-controlled Mac",
    author: "@instantricecook",
    category: "Agents & computer use",
    blurb: "Speech is transcribed and JEV maps the utterance to the right OS action instantly.",
    decision: { state: "“open my last download”", question: "Which action?", answer: "choice: open_file" },
    url: "https://x.com/instantricecook/status/2100814590300889426",
    likes: 5016,
  },
  {
    title: "jev-trader",
    author: "@jarrodwatts",
    category: "Trading & markets",
    blurb: "An automated trading bot that makes a buy/hold/sell decision on every block. Fun — and risky.",
    metric: "decision per block",
    decision: { state: "order book + recent trades", question: "Action?", answer: "choice: hold (0.72)" },
    url: "https://x.com/jarrodwatts/status/2100356151468585346",
    likes: 4913,
  },
  {
    title: "Doom gameplay agent",
    author: "@CompleteSkeptic",
    category: "Games & real time",
    blurb: "Game state is serialised to text every frame; JEV picks the next move fast enough to actually play.",
    decision: { state: "enemy left, ammo 12, hp 40", question: "Next move?", answer: "choice: strafe_right" },
    url: "https://x.com/CompleteSkeptic/status/2099925687465570372",
    likes: 4890,
  },
  {
    title: "Real-time ad blocker",
    author: "@iam_zachi",
    category: "Apps & tools",
    blurb: "DOM elements are classified as ad / not-ad on the fly, e.g. on speedtest.net, and removed before you see them.",
    decision: { state: "<div class=…> sponsored…", question: "Is this an ad?", answer: "noul 0.97 → hide" },
    url: "https://x.com/iam_zachi/status/2100529273186472318",
    likes: 3872,
  },
  {
    title: "500 emails for 3.5 cents",
    author: "@rileybrown",
    category: "Triage & routing",
    blurb: "Bulk inbox classification — the whole batch costs less than a single LLM call on a frontier model.",
    metric: "$0.035 / 500 emails",
    decision: { state: "email body", question: "Which folder?", answer: "choice: invoices" },
    url: "https://x.com/rileybrown/status/2100404532119269426",
    likes: 3853,
  },
  {
    title: "Triage 1,500 emails",
    author: "@ryanvogel",
    category: "Triage & routing",
    blurb: "Large-scale inbox triage: urgency, owner and reply-needed, answered in parallel per email.",
    metric: "1,500 emails in seconds",
    decision: { state: "email thread", question: "Needs a reply today?", answer: "noul 0.12" },
    url: "https://x.com/ryanvogel/status/2100042788851101842",
    likes: 3538,
  },
  {
    title: "700 leads scored in 40 s",
    author: "@romanbuildsaas",
    category: "Content & growth",
    blurb: "A sales-qualification pipeline: fit score and intent for every lead, fast enough to run on every signup.",
    metric: "700 leads / 40 s",
    decision: { state: "lead profile", question: "ICP fit (1–5)?", answer: "score 4.2" },
    url: "https://x.com/romanbuildsaas/status/2100891604735099103",
    likes: 3138,
  },
  {
    title: "Super Mario Bros agent",
    author: "@faadilhshaik",
    category: "Games & real time",
    blurb: "An NES platformer controlled by JEV decisions on a text rendering of the screen.",
    decision: { state: "goomba ahead, pit at x+3", question: "Button?", answer: "choice: jump" },
    url: "https://x.com/faadilhshaik/status/2100086301894881578",
    likes: 2860,
  },
  {
    title: "PostgreSQL jev() function",
    author: "@iam_zachi",
    category: "Apps & tools",
    blurb: "A SQL function that filters a table in plain language: WHERE jev(description, 'is vegan?') > 0.8.",
    decision: { state: "row.description", question: "Is it vegan?", answer: "noul 0.88" },
    url: "https://x.com/iam_zachi/status/2100679300756435135",
    likes: 2738,
  },
  {
    title: "Keystroke oracle",
    author: "@dabit3",
    category: "Apps & tools",
    blurb: "A predictive launcher that guesses which command you want after every keystroke.",
    decision: { state: "typed: “scr”", question: "Which command?", answer: "choice: screenshot" },
    url: "https://x.com/dabit3/status/2100756930054504776",
    likes: 2368,
  },
  {
    title: "1kpapers",
    author: "@nutlope",
    category: "Research & data",
    blurb: "1,018 AI papers grouped by topic for about $0.08 in total.",
    metric: "$0.08 / 1,018 papers",
    decision: { state: "title + abstract", question: "Topic?", answer: "choice: agents" },
    url: "https://x.com/nutlope/status/2100426999546184123",
    likes: 1962,
  },
  {
    title: "Model router on JEV",
    author: "@ephraimduncan",
    category: "Triage & routing",
    blurb: "JEV decides per prompt whether a cheap model is good enough or a frontier model is needed.",
    decision: { state: "user prompt", question: "Which model?", answer: "choice: small (0.84)" },
    url: "https://x.com/ephraimduncan/status/2100454070536351824",
    likes: 1858,
  },
  {
    title: "Every's editorial vibe check",
    author: "@danshipper",
    category: "Content & growth",
    blurb: "Editorial judgments on drafts against a house style — 1,709 judgments for under one cent.",
    metric: "1,709 judgments < $0.01",
    decision: { state: "draft paragraph", question: "On-voice?", answer: "noul 0.64" },
    url: "https://x.com/danshipper/status/2099947471518474522",
    likes: 1818,
  },
  {
    title: "Match a résumé to 400 companies",
    author: "@sarvagya_kul",
    category: "Triage & routing",
    blurb: "One candidate scored against 400 companies' openings on skills and seniority.",
    metric: "$0.0005 total",
    decision: { state: "résumé + job post", question: "Fit?", answer: "score 3.6 / 5" },
    url: "https://x.com/sarvagya_kul/status/2100980770206879849",
    likes: 1688,
  },
  {
    title: "Doomscroll filter",
    author: "@robj3d3",
    category: "Content & growth",
    blurb: "Every feed item is triaged into Read / Skim / Pass so you only read what matters.",
    decision: { state: "post", question: "Read, skim or pass?", answer: "choice: skim" },
    url: "https://x.com/robj3d3/status/2101074194260000982",
    likes: 1213,
  },
  {
    title: "Predictive spreadsheets",
    author: "@dabit3",
    category: "Apps & tools",
    blurb: "Cells autofill from context in ~100 ms — AI as a spreadsheet primitive, not a chat window.",
    metric: "~100 ms fill",
    decision: { state: "row context", question: "Category column?", answer: "choice: travel" },
    url: "https://x.com/dabit3/status/2100780008193020049",
    likes: 1169,
  },
  {
    title: "Slay the Spire 2",
    author: "@coolish",
    category: "Games & real time",
    blurb: "A deck-building strategy agent that plays a move in about 0.7 s.",
    metric: "0.7 s per move",
    decision: { state: "hand + enemy intents", question: "Which card?", answer: "choice: Defend" },
    url: "https://x.com/coolish/status/2100570517954838897",
    likes: 1137,
  },
  {
    title: "Chat bot without an LLM",
    author: "@CodingGarden",
    category: "Agents & computer use",
    blurb: "A tool-calling bot where JEV picks the tool and fills arguments; replies are templated, so answers are instant.",
    decision: { state: "“what's the weather in Pune?”", question: "Tool?", answer: "choice: get_weather" },
    url: "https://x.com/CodingGarden/status/2100665210419950031",
    likes: 1115,
  },
  {
    title: "Self-sorting Downloads folder",
    author: "@marcelpociot",
    category: "Apps & tools",
    blurb: "macOS automation that files every new download into the right folder — no LLM involved.",
    decision: { state: "filename + first page", question: "Folder?", answer: "choice: Receipts" },
    url: "https://x.com/marcelpociot/status/2100906882365788167",
    likes: 1092,
  },
  {
    title: "jevlike",
    author: "@vinnylarouge",
    category: "Research & data",
    blurb: "An open experiment: a small model trained to make typed decisions the JEV way.",
    decision: { state: "—", question: "Can we replicate it?", answer: "research" },
    url: "https://x.com/vinnylarouge/status/2100170846346097083",
    likes: 2018,
  },
];
