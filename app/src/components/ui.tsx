"use client";

import { motion } from "motion/react";
import { useState } from "react";

export function cn(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  className,
}: {
  id: string;
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24", className)}>
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="mb-10 max-w-3xl"
      >
        {eyebrow && (
          <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-jev-soft">{eyebrow}</p>
        )}
        <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
        {lead && <p className="mt-4 text-lg leading-relaxed text-ink-2 text-pretty">{lead}</p>}
      </motion.header>
      {children}
    </section>
  );
}

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-5 sm:p-6", className)} {...rest}>
      {children}
    </div>
  );
}

export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type PillTone = "jev" | "llm" | "neutral" | "good" | "warn" | "critical";
const PILL: Record<PillTone, string> = {
  jev: "border-jev/40 bg-jev/10 text-jev-soft",
  llm: "border-llm/40 bg-llm/10 text-llm-soft",
  neutral: "border-line-2 bg-surface-2 text-ink-2",
  good: "border-good/40 bg-good/10 text-[#5fd35f]",
  warn: "border-warn/40 bg-warn/10 text-warn",
  critical: "border-critical/50 bg-critical/10 text-[#f08a8a]",
};

export function Pill({ tone = "neutral", children, className }: { tone?: PillTone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", PILL[tone], className)}>
      {children}
    </span>
  );
}

export function Button({
  variant = "primary",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-jev text-white shadow-[0_0_24px_-6px] shadow-jev/60 hover:bg-[#4b94ea]",
        variant === "outline" && "border border-line-2 bg-surface-2 text-ink hover:border-jev/60",
        variant === "ghost" && "text-ink-2 hover:bg-surface-2 hover:text-ink",
        className,
      )}
      {...rest}
    />
  );
}

/** Horizontal probability bar with label. */
export function ProbBar({
  label,
  value,
  highlight,
  tone = "jev",
  delay = 0,
  suffix,
}: {
  label: React.ReactNode;
  value: number;
  highlight?: boolean;
  tone?: "jev" | "llm";
  delay?: number;
  suffix?: string;
}) {
  const color = tone === "jev" ? "bg-jev" : "bg-llm";
  return (
    <div className="grid grid-cols-[minmax(5.5rem,8rem)_1fr_3.2rem] items-center gap-3 text-sm">
      <span className={cn("truncate", highlight ? "font-medium text-ink" : "text-ink-2")}>{label}</span>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface-3">
        <motion.div
          className={cn("h-full rounded-full", color, !highlight && "opacity-45")}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(1.5, value * 100)}%` }}
          transition={{ duration: 0.6, delay, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </div>
      <span className={cn("text-right font-mono tabular-nums", highlight ? "text-ink" : "text-ink-3")}>
        {suffix ?? value.toFixed(2)}
      </span>
    </div>
  );
}

export function CodeBlock({ code, lang, className }: { code: string; lang?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={cn("group relative overflow-hidden rounded-xl border border-line bg-[#0a0d13]", className)}>
      <div className="flex items-center justify-between border-b border-line px-4 py-2 text-xs text-ink-3">
        <span className="font-mono">{lang ?? "code"}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(code).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            });
          }}
          className="rounded px-2 py-0.5 hover:bg-surface-2 hover:text-ink"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-ink-2">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: T; label: React.ReactNode }[];
  value: T;
  onChange: (t: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("inline-flex flex-wrap gap-1 rounded-xl border border-line bg-surface-2 p-1", className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "relative rounded-lg px-3 py-1.5 text-sm transition-colors",
            value === t.id ? "text-ink" : "text-ink-3 hover:text-ink-2",
          )}
        >
          {value === t.id && (
            <motion.span layoutId={`tab-${tabs.map((x) => x.id).join()}`} className="absolute inset-0 rounded-lg bg-surface-3" />
          )}
          <span className="relative">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

export function SimBadge({ className }: { className?: string }) {
  return (
    <span
      title="This demo imitates JEV's behaviour locally for teaching. No API is called."
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-warn/40 bg-warn/10 px-2.5 py-0.5 font-mono text-[11px] text-warn",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-warn" /> simulated · no API call
    </span>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "jev" | "llm" }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4">
      <p className="text-xs text-ink-3">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tabular-nums", tone === "jev" && "text-jev-soft", tone === "llm" && "text-llm-soft")}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-ink-3">{sub}</p>}
    </div>
  );
}
