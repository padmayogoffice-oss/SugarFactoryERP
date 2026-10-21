export function isBilingualField(field) {
  return Boolean(field.translit && field.marathiName) && (field.type === 'string' || field.type === 'text')
}

function toInputValue(field, value) {
  if (value === null || value === undefined) {
    if (field.type === 'boolean') return false
    if (['multiselect', 'tags', 'refs'].includes(field.type)) return []
    return ''
  }
  if (field.type === 'date') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
  }
  if (field.type === 'ref' || field.type === 'refs') {
    return field.type === 'refs'
      ? (Array.isArray(value) ? value : []).map((item) => String(item._id || item.id || item))
      : String(value._id || value.id || value)
  }
  return value
}

export function buildEntityForm(fields, record) {
  const form = {}
  const manualMarathi = {}
  for (const field of fields) {
    if (field.readOnly) continue
    const value = record ? toInputValue(field, record[field.name]) : undefined
    if (value !== undefined) form[field.name] = value
    else if (field.type === 'boolean') form[field.name] = field.default ?? false
    else if (['multiselect', 'tags', 'refs'].includes(field.type)) form[field.name] = []
    else form[field.name] = field.default ?? ''

    if (isBilingualField(field)) {
      form[field.marathiName] = record?.[field.marathiName] || ''
      manualMarathi[field.name] = Boolean(record?.[field.marathiName])
    }
  }
  return { form, manualMarathi }
}

export function buildEntityPayload(fields, form) {
  const payload = {}
  for (const field of fields) {
    if (field.readOnly) continue
    const value = form[field.name]
    if (field.type === 'boolean') payload[field.name] = Boolean(value)
    else if (['multiselect', 'tags', 'refs'].includes(field.type)) payload[field.name] = Array.isArray(value) ? value : []
    else if (value === '' || value === undefined) {
      if (!field.required) payload[field.name] = null
    } else if (['number', 'decimal', 'currency', 'percent'].includes(field.type)) payload[field.name] = Number(value)
    else payload[field.name] = value

    if (isBilingualField(field)) payload[field.marathiName] = form[field.marathiName] || ''
  }
  return payload
}
