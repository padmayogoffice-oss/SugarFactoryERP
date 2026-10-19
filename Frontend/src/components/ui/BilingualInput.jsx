/**
 * English + Marathi field pair.
 *
 * Renders the normal English input and, beside it (stacked on small screens), a
 * Marathi input that fills itself automatically while the user types. The Marathi
 * value stays editable: once edited by hand it is left alone until the user
 * presses "Auto" or clears the English text. The English value is never altered.
 *
 * The component is controlled: the parent owns `value`, `marathiValue` and the
 * `manual` flag, so it can be used from any form (generic registry form, users,
 * roles, future screens) without extra plumbing.
 */
import { useEffect, useRef, useState } from 'react'
import { hasLatinLetters, transliterateText } from '../../lib/transliteration'

const DEBOUNCE_MS = 350

const NOTE_TEXT = {
  approx: 'Approximate (offline mode) — please review.',
  error: 'Could not auto-transliterate. You can type the Marathi text manually.',
}

export default function BilingualInput({
  id,
  label,
  required = false,
  htmlRequired = false,
  unit,
  placeholder = '',
  value,
  marathiValue,
  manual,
  onChange,
  onMarathiChange,
  onManualChange,
}) {
  const english = value || ''
  // The English text the current Marathi value was generated from (null = unknown / stale).
  const [synced, setSynced] = useState(marathiValue ? english : null)
  // Outcome of the last conversion attempt: { text, kind: 'approx' | 'error' }.
  const [note, setNote] = useState(null)
  const latest = useRef(onMarathiChange)

  useEffect(() => {
    latest.current = onMarathiChange
  })

  // Debounced automatic conversion while the Marathi value has not been edited by hand.
  useEffect(() => {
    if (manual || synced === english) return undefined
    if (!english.trim() || !hasLatinLetters(english)) return undefined // handled in handleEnglishChange

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const result = await transliterateText(english)
        if (cancelled) return
        latest.current(result.text)
        setSynced(english)
        setNote(result.source === 'offline' || result.source === 'mixed' ? { text: english, kind: 'approx' } : null)
      } catch {
        if (!cancelled) setNote({ text: english, kind: 'error' })
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [english, manual, synced])

  function handleEnglishChange(event) {
    const next = event.target.value
    onChange(next)
    if (!next.trim()) {
      // Emptying the English field clears the Marathi field and returns to automatic mode.
      setSynced(next)
      onMarathiChange('')
      onManualChange(false)
    } else if (!manual && !hasLatinLetters(next)) {
      // Digits / punctuation only (or already Marathi): there is nothing to convert, mirror as typed.
      setSynced(next)
      onMarathiChange(next)
    }
  }

  function handleMarathiChange(event) {
    onMarathiChange(event.target.value)
    onManualChange(true)
  }

  function handleAuto() {
    setSynced(null) // force a fresh conversion of the current English text
    setNote(null)
    onManualChange(false)
  }

  const currentNote = note && note.text === english ? note.kind : null
  const loading = !manual && !currentNote && synced !== english && english.trim() !== '' && hasLatinLetters(english)
  const showAuto = english.trim() !== '' && (manual || currentNote === 'error')
  const marathiId = `${id}Mr`

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor={id}>
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
          {unit && <span className="ml-1 font-normal text-slate-400">({unit})</span>}
        </label>
        <input
          id={id}
          name={id}
          type="text"
          className="input"
          placeholder={placeholder}
          required={htmlRequired}
          value={english}
          onChange={handleEnglishChange}
        />
      </div>
      <div>
        <div className="flex items-center justify-between gap-2">
          <label className="label" htmlFor={marathiId}>{label} (Marathi)</label>
          {showAuto && (
            <button
              type="button"
              className="mb-1 text-xs font-medium text-emerald-700 hover:underline"
              title="Regenerate the Marathi text from the English text"
              onClick={handleAuto}
            >
              Auto
            </button>
          )}
        </div>
        <input
          id={marathiId}
          name={marathiId}
          type="text"
          lang="mr"
          className="input"
          value={marathiValue || ''}
          onChange={handleMarathiChange}
        />
        {loading && <p className="mt-1 text-xs text-slate-400">Transliterating…</p>}
        {currentNote && <p className="mt-1 text-xs text-amber-600">{NOTE_TEXT[currentNote]}</p>}
      </div>
    </div>
  )
}
