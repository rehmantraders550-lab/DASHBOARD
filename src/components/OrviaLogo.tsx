export function OrviaLogoMark({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer L bracket */}
      <path
        d="M5 21V7.5C5 6.11929 6.11929 5 7.5 5H21"
        stroke="#F97316"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* Inner orange glyph */}
      <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" fill="#F97316" />
    </svg>
  );
}

export function OrviaWordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <OrviaLogoMark className="w-7 h-7 shrink-0" />
      <div className="flex items-baseline gap-2">
        <span className="text-white font-bold tracking-wider text-lg font-sans">
          ORVIA
        </span>
        <span className="text-[#8E9296] text-[11px] font-medium tracking-[0.14em] uppercase">
          CODE VISUALIZER
        </span>
      </div>
    </div>
  );
}
