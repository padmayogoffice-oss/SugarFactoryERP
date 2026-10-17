/**
 * Table cell renderer and value formatters. Formats a value according to its
 * registry field type (date, currency, percent, reference, badge) so list tables
 * stay consistent without per-module code.
 */
import StatusBadge from './StatusBadge'

export function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.map((item) => (typeof item === 'object' ? item.name || item.label || item.code : item)).join(', ')
  if (typeof value === 'object') return value.name || value.label || value.code || value._id || '—'
  return value
}

export function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '—'
  const number = Number(value)
  if (Number.isNaN(number)) return String(value)
  return number.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function isStatusField(field, value) {
  if (!field) return false
  return field.name === 'status' || field.name.endsWith('Status') || field.options?.includes(value)
}

/** Renders a cell value according to its registry field definition. */
export default function Cell({ field, value }) {
  if (isStatusField(field, value)) return <StatusBadge value={value} />

  if (field?.type === 'currency') {
    const number = Number(value)
    if (Number.isNaN(number)) return <span>{formatValue(value)}</span>
    return <span className="tabular-nums">₹{formatNumber(number)}</span>
  }

  if (field?.type === 'percent') {
    const number = Number(value)
    if (Number.isNaN(number)) return <span>{formatValue(value)}</span>
    return <span className="tabular-nums">{formatNumber(number)}%</span>
  }

  if (field?.type === 'date') return <span className="whitespace-nowrap">{formatDate(value)}</span>

  if (field?.type === 'boolean') {
    return <StatusBadge value={value ? 'Yes' : 'No'} tone={value ? 'success' : 'neutral'} />
  }

  if (field?.type === 'number' || field?.type === 'decimal') {
    return <span className="tabular-nums">{formatNumber(value)}</span>
  }

  if (field?.type === 'ref' || field?.type === 'refs') {
    const text = formatValue(value)
    return <span className="text-slate-700">{text}</span>
  }

  if (field?.type === 'email' && value) {
    return <a className="text-emerald-700 hover:underline" href={`mailto:${value}`}>{value}</a>
  }

  if (field?.type === 'phone' && value) {
    return <a className="text-emerald-700 hover:underline" href={`tel:${value}`}>{value}</a>
  }

  return <span>{formatValue(value)}</span>
}
