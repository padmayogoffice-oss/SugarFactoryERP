import BilingualInput from '../ui/BilingualInput'
import { isBilingualField } from '../../utils/entityForm'

export default function EntityFieldInput({ field, value, options = [], manual, marathiValue, onChange, onMarathiChange, onManualChange }) {
  const common = { id: field.name, name: field.name, className: 'input', placeholder: field.placeholder || '' }

  if (isBilingualField(field)) {
    return (
      <BilingualInput
        id={field.name}
        label={field.label}
        required={field.required}
        unit={field.unit}
        placeholder={field.placeholder || ''}
        value={value}
        marathiValue={marathiValue}
        manual={manual}
        onChange={onChange}
        onMarathiChange={onMarathiChange}
        onManualChange={onManualChange}
      />
    )
  }

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
          {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
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
          {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      )
    case 'ref':
      return (
        <select {...common} value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
          <option value="">— Select —</option>
          {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
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
          {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
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
