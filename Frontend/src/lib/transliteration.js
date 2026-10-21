/**
 * Client-side transliteration helper shared by every form.
 *
 * Wraps `POST /api/transliterate` with a small result cache and in-flight
 * de-duplication, so identical text is never requested twice. Debouncing lives
 * in <BilingualInput>; this module only deals with requests and caching.
 */
import { transliterateApi } from '../api/transliterationApi'

export const MARATHI_SUFFIX = 'Mr'
export const MAX_TRANSLITERATION_LENGTH = 1000

const CACHE_LIMIT = 500
const cache = new Map() // text -> { text, source }
const inflight = new Map() // text -> Promise

/** True when there is at least one Latin letter to convert. */
export function hasLatinLetters(text) {
  return /[A-Za-z]/.test(text || '')
}

/**
 * Converts English text to Marathi. Resolves to `{ text, source }` where source
 * is "google" | "offline" | "mixed" | "none". Rejects when the service fails.
 */
export function transliterateText(text) {
  if (cache.has(text)) return Promise.resolve(cache.get(text))
  if (inflight.has(text)) return inflight.get(text)
  if (text.length > MAX_TRANSLITERATION_LENGTH) {
    return Promise.reject(new Error('Text is too long to transliterate automatically'))
  }

  const request = transliterateApi
    .convert(text)
    .then((result) => {
      // Offline (approximate) results are not cached so the better provider is retried.
      if (result.source !== 'offline' && result.source !== 'mixed') {
        cache.set(text, result)
        if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value)
      }
      return result
    })
    .finally(() => inflight.delete(text))

  inflight.set(text, request)
  return request
}

/**
 * Called just before a form is submitted. For every named field whose Marathi
 * value is still automatic (not manually edited) it makes sure the Marathi text
 * matches the final English text, even if the debounce had not fired yet.
 * Failures are ignored: the Marathi value is optional and never blocks saving.
 */
export async function finalizeMarathi(values, manual, names) {
  const next = { ...values }
  await Promise.all(
    names.map(async (name) => {
      const english = typeof values[name] === 'string' ? values[name].trim() : ''
      const key = `${name}${MARATHI_SUFFIX}`
      if (!english) {
        if (!manual[name]) next[key] = ''
        return
      }
      if (manual[name] || !hasLatinLetters(english)) return
      try {
        next[key] = (await transliterateText(english)).text
      } catch {
        /* keep whatever Marathi text is already in the form */
      }
    }),
  )
  return next
}
