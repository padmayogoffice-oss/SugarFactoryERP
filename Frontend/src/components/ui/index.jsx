export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {message && <p className="max-w-md text-sm text-slate-500">{message}</p>}
      {action}
    </div>
  )
}

export function Alert({ tone = 'danger', title, children, onClose }) {
  const tones = {
    danger: 'border-red-200 bg-red-50 text-red-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
  }
  return (
    <div className={`flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm ${tones[tone]}`} role="alert">
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button type="button" onClick={onClose} className="text-xs font-semibold opacity-70 hover:opacity-100">
          Dismiss
        </button>
      )}
    </div>
  )
}

export function Card({ title, subtitle, actions, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            {title && <h2 className="text-sm font-semibold text-slate-800">{title}</h2>}
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      <div>{children}</div>
    </section>
  )
}

export function Modal({ open, title, onClose, children, footer, wide = false }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:items-center">
      <div className={`w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} rounded-lg bg-white shadow-xl`}>
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            ✕
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-4 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">{footer}</footer>}
      </div>
    </div>
  )
}

export function Pagination({ page, totalPages, total, onChange }) {
  if (!totalPages || totalPages <= 1) {
    return <p className="px-3 py-2 text-xs text-slate-500">{total} record{total === 1 ? '' : 's'}</p>
  }
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <p className="text-xs text-slate-500">
        Page {page} of {totalPages} · {total} records
      </p>
      <div className="flex gap-2">
        <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </button>
        <button type="button" className="btn-secondary" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  )
}

export function StatTile({ label, value, tone = 'emerald', icon }) {
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

/** Horizontal bar list used by the dashboard and reports. */
export function BarList({ items, valueKey = 'value', labelKey = 'label', unit = '', tone = 'bg-emerald-500' }) {
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
