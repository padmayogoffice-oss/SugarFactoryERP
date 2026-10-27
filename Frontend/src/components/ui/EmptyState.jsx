export default function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <svg className="mb-1 h-12 w-12 text-emerald-600/70" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M24 44V12M15 44V22M33 44V19" />
        <path d="M21.5 36h5M21.8 27h4.4M12.6 35h4.8M30.6 31h4.8" />
        <path d="M24 12c-.5-4.2-3.7-6.6-8.5-6.9.6 4.5 3.8 6.9 8.5 6.9ZM24 12c.5-4.2 3.7-6.6 8.5-6.9-.6 4.5-3.8 6.9-8.5 6.9Z" />
        <path d="M6 44h36" />
      </svg>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {message && <p className="max-w-md text-sm text-slate-500">{message}</p>}
      {action}
    </div>
  )
}
