export default function StatTile({ label, value, tone = 'emerald' }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    violet: 'bg-violet-50 text-violet-700',
    slate: 'bg-slate-100 text-slate-700',
  }
  return (
    <div className="card flex items-center gap-3 px-4 py-3">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold uppercase ${tones[tone] || tones.slate}`}>
        {(label || '?').slice(0, 2)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <p className="text-lg font-semibold tabular-nums text-slate-800">
          {typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : value}
        </p>
      </div>
    </div>
  )
}
