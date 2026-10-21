import EmptyState from './EmptyState.jsx'

/** Horizontal bar list used by the dashboard and reports. */
export default function BarList({ items, valueKey = 'value', labelKey = 'label', unit = '', tone = 'bg-emerald-500' }) {
  if (!items?.length) return <EmptyState title="No data for this range" />
  const max = Math.max(...items.map((item) => Number(item[valueKey]) || 0), 1)

  return (
    <ul className="space-y-2 px-4 py-3">
      {items.map((item, index) => {
        const value = Number(item[valueKey]) || 0
        return (
          <li key={`${item[labelKey]}-${index}`}>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="truncate text-slate-600">{item[labelKey] ?? 'Unknown'}</span>
              <span className="shrink-0 font-medium tabular-nums text-slate-800">
                {value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                {unit}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max((value / max) * 100, 2)}%` }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
