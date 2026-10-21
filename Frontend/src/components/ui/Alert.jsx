export default function Alert({ tone = 'danger', title, children, onClose }) {
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
