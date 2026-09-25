import { Logo } from "./Nav";

const SOURCES: [string, string][] = [
  ["CampusX: Jev by TypeSafe AI (video)", "https://youtu.be/0zFfcEr1e9U"],
  ["TypeSafe: Introducing System One Models & Jev", "https://typesafe.ai/blog/introducing-system-one-models-and-jev"],
  ["Vercel: Evaluation on AI Gateway", "https://vercel.com/docs/ai-gateway/modalities/evaluation"],
  ["Vercel: TypeSafe API on AI Gateway", "https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe"],
  ["Pydantic AI: TypeSafe (Jev)", "https://pydantic.dev/docs/ai/models/typesafe/"],
  ["Cloudflare: Jev model page", "https://developers.cloudflare.com/ai/models/typesafe/jev/"],
  ["DataCamp: System One models & Jev", "https://www.datacamp.com/blog/system-one-models-jev"],
  ["MarkTechPost: A coding guide to Jev", "https://www.marktechpost.com/2026/09/23/a-coding-guide-to-typesafe-ai-jev/"],
  ["awesome-jev-use-cases", "https://github.com/walidboulanouar/awesome-jev-use-cases"],
  ["TypeSafe docs: Introduction", "https://docs.typesafe.ai/introduction"],
  ["Archer Hume: Jev's Architecture Unmasked", "https://archerhume.com/posts/jevs-architecture-unmasked"],
  ["LangChain: Building a Harness with Jev", "https://www.langchain.com/blog/building-a-harness-with-jev"],
  ["Benchmark Heaven: JevBench", "https://benchmarkheaven.com/jev-models"],
  ["Ship with Jev: GitHub projects", "https://www.shipwithjev.com/type/github"],
];

export function Footer() {
  return (
    <footer className="mt-10 border-t border-line bg-surface/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1fr_2fr]">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <Logo /> JEV.explained
          </div>
          <p className="mt-3 text-sm text-ink-2">
            An independent, educational explainer. It is not affiliated with TypeSafe AI. Interactive demos on this page are simulations
            and make no API calls.
          </p>
          <p className="mt-3 text-xs text-ink-3">Facts as of 24 Sept 2026. JEV is moving fast, so check the docs.</p>
        </div>
        <div>
          <p className="text-sm font-medium">Sources</p>
          <ul className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
            {SOURCES.map(([t, u]) => (
              <li key={u}>
                <a href={u} target="_blank" rel="noreferrer" className="text-ink-2 hover:text-jev-soft">
                  {t} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
