import { useMemo, useState } from 'react'
import { Alert } from '../../components/ui'
import { apiError } from '../../api/client'

/** Converts a stored value into the shape an <input> expects. */
function toInputValue(field, value) {
  if (value === null || value === undefined) {
    if (field.type === 'boolean') return false
    if (field.type === 'multiselect' || field.type === 'tags' || field.type === 'refs') return []
    return ''
  }
  if (field.type === 'date') {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toISOString().slice(0, 10)
  }
  if (field.type === 'ref' || field.type === 'refs') {
    return field.type === 'refs'
      ? (Array.isArray(value) ? value : []).map((item) => String(item._id || item.id || item))
      : String(value._id || value.id || value)
  }
  return value
}

function initialForm(submodule, record) {
  const state = {}
  for (const field of submodule.fields) {
    if (field.readOnly) continue
    const value = record ? toInputValue(field, record[field.name]) : undefined
    if (value === undefined) {
      if (field.type === 'boolean') state[field.name] = field.default ?? false
      else if (field.type === 'multiselect' || field.type === 'tags' || field.type === 'refs') state[field.name] = []
      else state[field.name] = field.default ?? ''
    } else {
      state[field.name] = value
    }
  }
  return state
}

/** Coerces form state into the JSON the API expects. */
function toPayload(submodule, form) {
  const payload = {}
  for (const field of submodule.fields) {
    if (field.readOnly) continue
    const value = form[field.name]
    if (field.type === 'boolean') {
      payload[field.name] = Boolean(value)
    } else if (field.type === 'multiselect' || field.type === 'tags' || field.type === 'refs') {
      payload[field.name] = Array.isArray(value) ? value : []
    } else if (value === '' || value === undefined) {
      if (!field.required) payload[field.name] = null
    } else if (field.type === 'number' || field.type === 'decimal' || field.type === 'currency' || field.type === 'percent') {
      payload[field.name] = Number(value)
    } else {
      payload[field.name] = value
    }
  }
  return payload
}

function FieldInput({ field, value, options, onChange }) {
  const common = { id: field.name, name: field.name, className: 'input', placeholder: field.placeholder || '' }

  switch (field.type) {
    case 'boolean':
      return (
        <label className="flex items-center gap-2 py-1.5 text-sm text-slate-700">
          <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
          {field.label}
        </label>
      )

    case 'select':
      return (
        <select {...common} value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
          <option value="">— Select —</option>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      )

    case 'multiselect':
    case 'tags':
      return (
        <select
          {...common}
          multiple
          className="input h-28"
          value={Array.isArray(value) ? value : []}
          onChange={(event) => onChange([...event.target.selectedOptions].map((option) => option.value))}
        >
          {(field.options || []).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      )

    case 'ref':
      return (
        <select {...common} value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
          <option value="">— Select —</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      )

    case 'refs':
      return (
        <select
          {...common}
          multiple
          className="input h-28"
          value={Array.isArray(value) ? value : []}
          onChange={(event) => onChange([...event.target.selectedOptions].map((option) => option.value))}
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      )

    case 'date':
      return <input {...common} type="date" value={value || ''} onChange={(event) => onChange(event.target.value)} />

    case 'number':
    case 'decimal':
    case 'currency':
    case 'percent':
      return (
        <input
          {...common}
          type="number"
          step={field.step || (field.type === 'number' ? '1' : '0.01')}
          min={field.min}
          max={field.max}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
        />
      )

    case 'email':
      return <input {...common} type="email" value={value || ''} onChange={(event) => onChange(event.target.value)} />

    case 'phone':
      return <input {...common} type="tel" value={value || ''} onChange={(event) => onChange(event.target.value)} />

    default:
      return <input {...common} type="text" value={value || ''} onChange={(event) => onChange(event.target.value)} />
  }
}

/** Renders a create/edit form for any registry submodule. */
export default function ResourceForm({ submodule, record, refOptions = {}, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => initialForm(submodule, record))
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const editableFields = useMemo(() => submodule.fields.filter((field) => !field.readOnly), [submodule])

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onSubmit(toPayload(submodule, form))
    } catch (requestError) {
      setError(apiError(requestError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert title={error.message} onClose={() => setError(null)}>
          {error.details?.length ? (
            <ul className="mt-1 list-inside list-disc text-xs">
              {error.details.map((detail) => <li key={detail}>{detail}</li>)}
            </ul>
          ) : null}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {editableFields.map((field) => (
          <div key={field.name} className={field.type === 'multiselect' || field.type === 'tags' || field.type === 'refs' ? 'sm:col-span-2' : ''}>
            {field.type !== 'boolean' && (
              <label className="label" htmlFor={field.name}>
                {field.label}
                {field.required && <span className="ml-0.5 text-red-500">*</span>}
                {field.unit && <span className="ml-1 font-normal text-slate-400">({field.unit})</span>}
              </label>
            )}
            <FieldInput
              field={field}
              value={form[field.name]}
              options={refOptions[field.name] || []}
              onChange={(value) => setForm((current) => ({ ...current, [field.name]: value }))}
            />
            {field.help && <p className="mt-1 text-xs text-slate-400">{field.help}</p>}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : record ? 'Save changes' : 'Create'}
        </button>
      </div>
    </form>
  )
}
