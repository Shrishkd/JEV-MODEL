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
