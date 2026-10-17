const TONES = {
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-sky-100 text-sky-700',
  neutral: 'bg-slate-100 text-slate-600',
}

const STATUS_TONES = {
  active: 'success', approved: 'success', completed: 'success', paid: 'success', pass: 'success',
  closed: 'success', received: 'success', verified: 'success', posted: 'success',
  draft: 'neutral', inactive: 'neutral', new: 'info', submitted: 'info', pending: 'warning',
  open: 'warning', partial: 'warning', 'in-progress': 'info', processing: 'info', attending: 'info',
  investigating: 'warning', rejected: 'danger', cancelled: 'danger', failed: 'danger', fail: 'danger',
  overdue: 'danger', blocked: 'danger', 'on-hold': 'warning', suspended: 'danger',
}

/** Renders a value as a colour-coded pill, inferring the tone from the value. */
export default function StatusBadge({ value, tone }) {
  if (value === null || value === undefined || value === '') return <span className="text-slate-400">—</span>
  const key = String(value).toLowerCase()
  const resolved = tone || STATUS_TONES[key] || 'neutral'
  return <span className={`badge ${TONES[resolved] || TONES.neutral}`}>{String(value)}</span>
}

export { TONES, STATUS_TONES }
