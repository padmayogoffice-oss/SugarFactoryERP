/**
 * English -> Marathi transliteration service.
 *
 * Primary provider: Google Input Tools (`itc=mr-t-i0-und`), an ML transliteration
 * endpoint that needs no API key. It is not an officially supported, SLA-backed
 * product, so the service degrades gracefully to the offline rule engine in
 * `offlineMarathi.js` when it is unreachable (provider "auto", the default).
 *
 * The service works word by word: only Latin letter runs are converted, while
 * digits, punctuation, spacing, existing Devanagari, e-mail addresses, URLs and
 * code-like tokens (GSTIN, PAN, IFSC, all-caps alphanumeric codes, times,
 * {{placeholders}}) are left exactly as typed. Per-word results are cached, so
 * typing a long phrase only costs one upstream request per *new* word.
 *
 * Environment (all optional):
 *   TRANSLITERATION_PROVIDER    auto (default) | google | offline
 *   TRANSLITERATION_TIMEOUT_MS  per-request upstream timeout, default 4000
 *   TRANSLITERATION_GOOGLE_URL  override the upstream endpoint (self-hosting / tests)
 */
import { transliterateWord as offlineWord } from './offlineMarathi.js';

const DEFAULT_GOOGLE_URL = 'https://inputtools.google.com/request';
const MAX_TEXT_LENGTH = 1000;
const MAX_UNIQUE_WORDS = 80;
const CONCURRENCY = 6;
const CACHE_LIMIT = 10000;
const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 60 * 1000;

const DEVANAGARI = /[\u0900-\u097F]/;
const LATIN_RUN = /[A-Za-z]+/g;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_LIKE = /^(https?:\/\/|www\.)\S+$|^[a-z0-9-]+(\.[a-z0-9-]+)*\.(com|in|org|net|co|gov|edu|info|biz|io)(\/\S*)?$/i;
const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i;
const PAN = /^[A-Z]{5}\d{4}[A-Z]$/i;
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
const CLOCK = /^\d{1,2}([:.]\d{2})?(am|pm)$/i;
const PLACEHOLDER = /[{}<>]/;
// All-caps letters + digits such as MH12AB1234 or PO-2026-0007: an identifier, not a word.
const CAPS_CODE = /^(?=.*\d)(?=.*[A-Z])[A-Z0-9\-/]{5,}$/;

class TransliterationError extends Error {
  constructor(message, statusCode = 503) {
    super(message);
    this.name = 'TransliterationError';
    this.statusCode = statusCode;
  }
}

/** True when a whitespace-delimited token must never be modified. */
function isProtectedToken(rawToken) {
  const token = rawToken.replace(/^[("'[]+|[)"',.;:!?\]]+$/g, '');
  if (!token) return false;
  return (
    EMAIL.test(token) ||
    URL_LIKE.test(token) ||
    GSTIN.test(token) ||
    PAN.test(token) ||
    IFSC.test(token) ||
    CLOCK.test(token) ||
    PLACEHOLDER.test(token) ||
    CAPS_CODE.test(token)
  );
}

/* ----------------------------------------------------------------- cache --- */

const wordCache = new Map(); // lowercase word -> Devanagari (online results only)

function cacheGet(word) {
  if (!wordCache.has(word)) return undefined;
  const value = wordCache.get(word);
  wordCache.delete(word); // refresh recency
  wordCache.set(word, value);
  return value;
}

function cacheSet(word, value) {
  wordCache.set(word, value);
  if (wordCache.size > CACHE_LIMIT) wordCache.delete(wordCache.keys().next().value);
}

function clearCache() {
  wordCache.clear();
}

/* --------------------------------------------------------------- provider --- */

const breaker = { failures: 0, openUntil: 0 };

function resetBreaker() {
  breaker.failures = 0;
  breaker.openUntil = 0;
}

function providerMode() {
  const mode = String(process.env.TRANSLITERATION_PROVIDER || 'auto').toLowerCase();
  return ['auto', 'google', 'offline'].includes(mode) ? mode : 'auto';
}

async function googleWord(word, signal) {
  const base = process.env.TRANSLITERATION_GOOGLE_URL || DEFAULT_GOOGLE_URL;
  const url = `${base}?text=${encodeURIComponent(word)}&itc=mr-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=sugar-factory-erp`;
  const timeoutMs = Number(process.env.TRANSLITERATION_TIMEOUT_MS) || 4000;
  const timeout = AbortSignal.timeout(timeoutMs);
  const response = await fetch(url, {
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Upstream responded ${response.status}`);

  const body = await response.json();
  // Shape: ["SUCCESS", [[ "<input>", ["<candidate1>", "<candidate2>", ...], ... ]]]
  if (!Array.isArray(body) || body[0] !== 'SUCCESS') throw new Error('Upstream returned no result');
  const candidate = body[1]?.[0]?.[1]?.[0];
  if (typeof candidate !== 'string' || !DEVANAGARI.test(candidate)) throw new Error('Upstream result was not Devanagari');
  return candidate;
}

/** Runs `worker` over `items` with a fixed number of concurrent tasks. */
async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

/**
 * Resolves each unique lowercase word to Devanagari.
 * Returns a Map(word -> { value, source }).
 */
async function resolveWords(words, signal) {
  const mode = providerMode();
  const resolved = new Map();
  const pending = [];

  for (const word of words) {
    if (mode === 'offline') {
      resolved.set(word, { value: offlineWord(word), source: 'offline' });
      continue;
    }
    const cached = cacheGet(word);
    if (cached !== undefined) resolved.set(word, { value: cached, source: 'google' });
    else pending.push(word);
  }
  if (!pending.length) return resolved;

  const breakerOpen = Date.now() < breaker.openUntil;
  if (breakerOpen && mode === 'google') {
    throw new TransliterationError('Transliteration service is temporarily unavailable');
  }

  await mapPool(pending, CONCURRENCY, async (word) => {
    if (!breakerOpen) {
      try {
        const value = await googleWord(word, signal);
        cacheSet(word, value);
        breaker.failures = 0;
        resolved.set(word, { value, source: 'google' });
        return;
      } catch (error) {
        if (signal?.aborted) throw error;
        breaker.failures += 1;
        if (breaker.failures >= BREAKER_THRESHOLD) breaker.openUntil = Date.now() + BREAKER_COOLDOWN_MS;
      }
    }
    if (mode === 'google') throw new TransliterationError('Transliteration service is unavailable');
    resolved.set(word, { value: offlineWord(word), source: 'offline' });
  });

  return resolved;
}

/* ------------------------------------------------------------------- main --- */

/**
 * Transliterates `text`. Returns `{ text, source }` where source is
 * "google", "offline", "mixed" or "none" (nothing needed converting).
 */
async function transliterate(text, { signal } = {}) {
  if (typeof text !== 'string') throw new TransliterationError('text must be a string', 400);
  if (text.length > MAX_TEXT_LENGTH) {
    throw new TransliterationError(`text must be at most ${MAX_TEXT_LENGTH} characters`, 400);
  }

  // Split but keep whitespace so spacing is reproduced exactly.
  const parts = text.split(/(\s+)/);
  const uniqueWords = new Set();

  for (const part of parts) {
    if (!part || /^\s+$/.test(part) || isProtectedToken(part)) continue;
    for (const run of part.match(LATIN_RUN) || []) uniqueWords.add(run.toLowerCase());
  }
  if (uniqueWords.size > MAX_UNIQUE_WORDS) {
    throw new TransliterationError(`text may contain at most ${MAX_UNIQUE_WORDS} distinct words`, 400);
  }
  if (!uniqueWords.size) return { text, source: 'none' };

  const resolved = await resolveWords([...uniqueWords], signal);
  const sources = new Set();

  const output = parts
    .map((part) => {
      if (!part || /^\s+$/.test(part) || isProtectedToken(part)) return part;
      return part.replace(LATIN_RUN, (run) => {
        const entry = resolved.get(run.toLowerCase());
        sources.add(entry.source);
        return entry.value;
      });
    })
    .join('');

  const source = sources.size > 1 ? 'mixed' : [...sources][0] || 'none';
  return { text: output, source };
}

export {
  transliterate,
  isProtectedToken,
  clearCache,
  resetBreaker,
  TransliterationError,
  MAX_TEXT_LENGTH,
};
