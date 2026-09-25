"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CurrencyToggle } from "@/lib/currency";
import { cn } from "@/components/ui";

const LINKS = [
  ["what", "What"],
  ["system1", "System 1"],
  ["how", "API"],
  ["vs-llm", "vs LLM"],
  ["calibration", "RLCD"],
  ["architecture", "Inside"],
  ["use-cases", "Use cases"],
  ["limits", "Limits"],
  ["video", "Video"],
] as const;

export function Nav() {
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    LINKS.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Logo />
          <span>
            JEV<span className="text-ink-3">.explained</span>
          </span>
        </Link>
        <div className="hidden flex-1 items-center justify-center gap-0.5 xl:flex">
          {LINKS.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className={cn(
                "whitespace-nowrap rounded-md px-2.5 py-1 text-[13px] transition-colors",
                active === id ? "bg-surface-2 text-ink" : "text-ink-3 hover:text-ink-2",
              )}
            >
              {label}
            </a>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 xl:ml-0">
          <CurrencyToggle />
          <Link
            href="/lab"
            className="hidden whitespace-nowrap rounded-lg border border-jev/50 bg-jev/10 px-3 py-1.5 text-xs font-medium text-jev-soft hover:bg-jev/20 sm:inline-block"
          >
            BERT vs JEV Lab →
          </Link>
          <button
            className="rounded-md p-2 text-ink-2 xl:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
            </svg>
          </button>
        </div>
      </nav>
      {open && (
        <div className="grid grid-cols-2 gap-1 border-t border-line px-4 py-3 xl:hidden">
          {LINKS.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={() => setOpen(false)} className="rounded-md px-2 py-1.5 text-sm text-ink-2 hover:bg-surface-2">
              {label}
            </a>
          ))}
          <Link href="/lab" className="col-span-2 rounded-md px-2 py-1.5 text-sm text-jev-soft">
            BERT vs JEV Lab →
          </Link>
        </div>
      )}
    </header>
  );
}

export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#86b6ef" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="#0d1117" stroke="url(#lg)" strokeWidth="1.5" />
      <path d="M8 16h6l3-6M17 10l3 6h4M14 16l3 6" stroke="url(#lg)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="16" r="2" fill="#22d3ee" />
    </svg>
  );
}
