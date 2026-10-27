export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500" role="status" aria-live="polite">
      {/* Two mill rollers turn against each other while a cane stalk feeds through. */}
      <svg className="h-9 w-11 shrink-0 text-emerald-600" viewBox="0 0 44 36" fill="none" aria-hidden="true">
        <path className="sf-loader-cane" d="M22 2v32" stroke="#84cc16" strokeWidth="3" strokeLinecap="round" />
        <g className="sf-loader-roller">
          <circle cx="13" cy="18" r="9" stroke="currentColor" strokeWidth="3" strokeDasharray="5 4.1" />
          <circle cx="13" cy="18" r="2.5" fill="currentColor" />
        </g>
        <g className="sf-loader-roller-rev">
          <circle cx="31" cy="18" r="9" stroke="currentColor" strokeWidth="3" strokeDasharray="5 4.1" />
          <circle cx="31" cy="18" r="2.5" fill="currentColor" />
        </g>
      </svg>
      <span className="text-sm">{label}</span>
    </div>
  )
}
