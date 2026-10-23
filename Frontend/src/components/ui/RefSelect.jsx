/**
 * Searchable related-record selector (used by every reference field).
 *
 *  - loads options from the backend on demand and as you type (debounced), so it
 *    works with thousands of records, not just the first 50;
 *  - shows a record's code together with its name;
 *  - narrows by parent selections (`filters`), e.g. only the chosen farmer's contracts;
 *  - resolves an existing selection by id, so edit forms always show the label;
 *  - reports the picked option to `onChange`, so the form can auto-fill dependants;
 *  - handles loading, empty, no-access and error states.
 *
 * Works for a single reference and for lists of references (`multiple`).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, apiError } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

const DEBOUNCE_MS = 250

/** The submodule a reference points at: "CaneContract" -> key "caneContract". */
function findTarget(navigation, modelName) {
  const key = String(modelName || '').replace(/^./, (letter) => letter.toLowerCase())
  for (const moduleDef of navigation?.modules || []) {
    const submodule = moduleDef.submodules.find((item) => item.key === key)
    if (submodule) return { moduleKey: moduleDef.key, submodule }
  }
  return null
}

export function optionText(option) {
  if (!option) return ''
  return option.description ? `${option.label} — ${option.description}` : option.label
}

export default function RefSelect({ field, value, onChange, filters = {}, multiple = false, disabled = false, id }) {
  const { navigation } = useAuth()
  const target = useMemo(() => findTarget(navigation, field.ref), [navigation, field.ref])
  const endpoint = target ? `/${target.moduleKey}/${target.submodule.key}/options` : null
  const targetName = target?.submodule.name || field.label

  const selectedIds = useMemo(() => (multiple ? (Array.isArray(value) ? value : []) : value ? [value] : []), [multiple, value])
  const filterKey = JSON.stringify(filters)

  const rootRef = useRef(null)
  const requestRef = useRef(0)
  const filtersRef = useRef(filters)
  filtersRef.current = filters
  const known = useRef(new Map()) // id -> option, so labels survive closing the list
  const [, force] = useState(0)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [active, setActive] = useState(0)

  const fetchOptions = useCallback(
    async (params) => {
      const response = await api.get(endpoint, { params })
      return response.data.data || []
    },
    [endpoint],
  )

  const remember = useCallback((list) => {
    for (const option of list) known.current.set(option.id, option)
  }, [])

  // Resolve labels of the current selection that we have not seen yet (edit forms, auto-fill).
  const missingKey = selectedIds.filter((selectedId) => !known.current.has(selectedId)).join(',')
  useEffect(() => {
    if (!endpoint || !missingKey) return undefined
    let cancelled = false
    fetchOptions({ ids: missingKey, limit: 100 })
      .then((list) => {
        if (cancelled) return
        remember(list)
        force((count) => count + 1)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [endpoint, missingKey, fetchOptions, remember])

  const search = useCallback(
    async (text) => {
      if (!endpoint) return
      const ticket = ++requestRef.current
      setLoading(true)
      setError(null)
      try {
        const params = { limit: 25, ...filtersRef.current }
        if (text.trim()) params.q = text.trim()
        const list = await fetchOptions(params)
        if (ticket !== requestRef.current) return // a newer search superseded this one
        remember(list)
        setItems(list)
        setActive(0)
      } catch (requestError) {
        if (ticket !== requestRef.current) return
        setError(requestError?.response?.status === 403 ? 'forbidden' : apiError(requestError).message)
        setItems([])
      } finally {
        if (ticket === requestRef.current) setLoading(false)
      }
    },
    [endpoint, fetchOptions, remember],
  )

  // Fetch when opened, when typing, and when a parent filter changes.
  useEffect(() => {
    if (!open) return undefined
    const timer = setTimeout(() => search(query), query ? DEBOUNCE_MS : 0)
    return () => clearTimeout(timer)
  }, [open, query, search, filterKey])

  useEffect(() => {
    function onDocumentClick(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onDocumentClick)
    return () => document.removeEventListener('mousedown', onDocumentClick)
  }, [])

  function choose(option) {
    if (multiple) {
      const next = selectedIds.includes(option.id) ? selectedIds.filter((item) => item !== option.id) : [...selectedIds, option.id]
      onChange(next, option)
      return
    }
    onChange(option.id, option)
    setOpen(false)
    setQuery('')
  }

  function clear() {
    onChange(multiple ? [] : '', null)
    setQuery('')
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((index) => Math.min(index + 1, Math.max(items.length - 1, 0)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && open && items[active]) {
      event.preventDefault() // choosing a record must never submit the form
      choose(items[active])
    } else if (event.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }

  const selectedOption = !multiple && selectedIds[0] ? known.current.get(selectedIds[0]) : null
  const shown = open ? query : selectedOption ? optionText(selectedOption) : selectedIds[0] && !multiple ? 'Loading…' : ''

  if (!endpoint) {
    return <input id={id} className="input" disabled readOnly value="" placeholder={`No access to ${field.label} records`} />
  }

  return (
    <div ref={rootRef} className="relative">
      {multiple && selectedIds.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1">
          {selectedIds.map((selectedId) => (
            <span key={selectedId} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
              {optionText(known.current.get(selectedId)) || '…'}
              {!disabled && (
                <button type="button" aria-label="Remove" className="text-emerald-700 hover:text-red-600" onClick={() => onChange(selectedIds.filter((item) => item !== selectedId), null)}>
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          id={id}
          name={field.name}
          className="input pr-8"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          placeholder={multiple ? `Search ${targetName}…` : `Search or select ${targetName}…`}
          value={multiple ? query : shown}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setOpen(true)
            setQuery(event.target.value)
          }}
          onKeyDown={onKeyDown}
        />
        {!multiple && selectedIds.length > 0 && !disabled && (
          <button type="button" aria-label={`Clear ${field.label}`} className="absolute inset-y-0 right-2 text-slate-400 hover:text-red-600" onClick={clear}>
            ×
          </button>
        )}
      </div>

      {open && (
        <ul role="listbox" className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg">
          {loading && <li className="px-3 py-2 text-slate-500">Loading…</li>}

          {!loading && error === 'forbidden' && <li className="px-3 py-2 text-slate-500">You do not have access to {targetName} records.</li>}

          {!loading && error && error !== 'forbidden' && (
            <li className="px-3 py-2 text-red-600">
              Could not load {targetName}: {error}{' '}
              <button type="button" className="underline" onClick={() => search(query)}>
                Retry
              </button>
            </li>
          )}

          {!loading && !error && items.length === 0 && (
            <li className="px-3 py-2 text-slate-500">
              {query
                ? `No ${targetName} matches “${query}”.`
                : Object.keys(filters).length
                  ? `No ${targetName} found for the current selection.`
                  : `No ${targetName} records yet — create one first.`}
            </li>
          )}

          {!loading &&
            !error &&
            items.map((option, index) => {
              const chosen = selectedIds.includes(option.id)
              return (
                <li
                  key={option.id}
                  role="option"
                  aria-selected={chosen}
                  className={`cursor-pointer px-3 py-1.5 ${index === active ? 'bg-emerald-50' : ''} ${chosen ? 'font-medium text-emerald-800' : 'text-slate-700'}`}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(event) => {
                    event.preventDefault() // keep focus so blur does not close the list before the click lands
                    choose(option)
                  }}
                >
                  {multiple && <span className="mr-2">{chosen ? '☑' : '☐'}</span>}
                  <span>{option.label}</span>
                  {option.description && <span className="ml-2 text-slate-400">{option.description}</span>}
                </li>
              )
            })}
        </ul>
      )}
    </div>
  )
}