"use client";

import { createContext, useContext, useMemo, useState, useSyncExternalStore } from "react";

export type Currency = "INR" | "USD";

// Rate implied by the video's own numbers (GPT-5 $1.25/M ≈ ₹119/M). Editable in the UI.
export const DEFAULT_USD_TO_INR = 95;

type Ctx = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  rate: number;
  setRate: (r: number) => void;
  /** Format an amount given in USD in the active currency. */
  fmt: (usd: number, opts?: { compact?: boolean; digits?: number }) => string;
};

const CurrencyContext = createContext<Ctx | null>(null);

// Persisted preference as a tiny external store (SSR renders ₹, the client then reads localStorage).
const listeners = new Set<() => void>();
let memory: Currency | null = null; // fallback when storage is blocked
const readCurrency = (): Currency => {
  if (memory) return memory;
  try {
    return localStorage.getItem("jev-currency") === "USD" ? "USD" : "INR";
  } catch {
    return "INR";
  }
};
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const currency = useSyncExternalStore(subscribe, readCurrency, () => "INR" as Currency);
  const [rate, setRate] = useState(DEFAULT_USD_TO_INR);

  const value = useMemo<Ctx>(() => {
    const setCurrency = (c: Currency) => {
      memory = c;
      try {
        localStorage.setItem("jev-currency", c);
      } catch {}
      listeners.forEach((l) => l());
    };
    const fmt: Ctx["fmt"] = (usd, opts = {}) => {
      const amount = currency === "INR" ? usd * rate : usd;
      return formatMoney(amount, currency, opts);
    };
    return { currency, setCurrency, rate, setRate, fmt };
  }, [currency, rate]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside <CurrencyProvider>");
  return ctx;
}

export function formatMoney(amount: number, currency: Currency, opts: { compact?: boolean; digits?: number } = {}) {
  const symbol = currency === "INR" ? "₹" : "$";
  const abs = Math.abs(amount);
  if (opts.compact && currency === "INR" && abs >= 1e5) {
    // Indian units read naturally for this audience: lakh / crore.
    if (abs >= 1e7) return `${symbol}${trim(amount / 1e7)} Cr`;
    return `${symbol}${trim(amount / 1e5)} L`;
  }
  if (opts.compact && abs >= 1e6) return `${symbol}${trim(amount / 1e6)}M`;
  const digits = opts.digits ?? (abs === 0 ? 0 : abs < 0.01 ? 5 : abs < 1 ? 3 : abs < 100 ? 2 : 0);
  return (
    symbol +
    amount.toLocaleString(currency === "INR" ? "en-IN" : "en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  );
}

const trim = (x: number) => (Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(2).replace(/\.?0+$/, ""));

export function CurrencyToggle({ className = "" }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();
  return (
    <div
      role="radiogroup"
      aria-label="Currency"
      className={`inline-flex rounded-full border border-line bg-surface-2 p-0.5 text-xs font-medium ${className}`}
    >
      {(["INR", "USD"] as const).map((c) => (
        <button
          key={c}
          role="radio"
          aria-checked={currency === c}
          onClick={() => setCurrency(c)}
          className={`rounded-full px-3 py-1 transition-colors ${
            currency === c ? "bg-jev text-white" : "text-ink-2 hover:text-ink"
          }`}
        >
          {c === "INR" ? "₹ INR" : "$ USD"}
        </button>
      ))}
    </div>
  );
}
