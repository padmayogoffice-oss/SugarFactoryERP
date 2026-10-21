export default function Pagination({ page, totalPages, total, onChange }) {
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
