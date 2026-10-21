import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { transliterate, clearCache, resetBreaker, isProtectedToken } from '../src/services/transliterationService.js';
import { transliterateWord } from '../src/services/offlineMarathi.js';
import { modules } from '../src/registry/index.js';
import { validatePayload } from '../src/validators/fieldValidator.js';

// A stand-in for the upstream provider so tests never touch the network.
const DICTIONARY = { snehal: 'स्नेहल', maharashtra: 'महाराष्ट्र', factory: 'फॅक्टरी', name: 'नेम' };
let upstreamHits = 0;
const server = http.createServer((req, res) => {
  upstreamHits += 1;
  const word = new URL(req.url, 'http://x').searchParams.get('text');
  res.setHeader('Content-Type', 'application/json');
  if (DICTIONARY[word]) res.end(JSON.stringify(['SUCCESS', [[word, [DICTIONARY[word]], [], {}]]]));
  else res.end(JSON.stringify(['FAILED_TO_PARSE_REQUEST_BODY']));
});
await new Promise((resolve) => server.listen(0, resolve));
const upstreamUrl = `http://127.0.0.1:${server.address().port}/request`;

beforeEach(() => {
  clearCache();
  resetBreaker();
  upstreamHits = 0;
  process.env.TRANSLITERATION_PROVIDER = 'auto';
  process.env.TRANSLITERATION_GOOGLE_URL = upstreamUrl;
});
after(() => server.close());

test('transliterates words and keeps spacing', async () => {
  const result = await transliterate('Factory Name');
  assert.equal(result.text, 'फॅक्टरी नेम');
  assert.equal(result.source, 'google');
  assert.equal((await transliterate('Maharashtra')).text, 'महाराष्ट्र');
});

test('caches words so repeat typing makes no new upstream calls', async () => {
  await transliterate('Snehal');
  await transliterate('Snehal Snehal');
  assert.equal(upstreamHits, 1);
});

test('digits, dates, codes, emails and URLs are never modified', async () => {
  assert.equal((await transliterate('Snehal123')).text, 'स्नेहल123');
  upstreamHits = 0;
  for (const keep of ['12345', '19-10-2026', '27ABCDE1234F1Z5', 'ABCDE1234F', 'snehal@example.com', 'https://example.com/a', 'www.example.in', 'MH12AB1234', '10:30AM', '{{userName}}', 'SBIN0001234']) {
    const result = await transliterate(keep);
    assert.equal(result.text, keep, keep);
    assert.equal(result.source, 'none');
  }
  assert.equal(upstreamHits, 0);
});

test('mixed sentence only converts the plain words', async () => {
  const result = await transliterate('Snehal at snehal@example.com on 19-10-2026');
  assert.match(result.text, /^स्नेहल \S+ snehal@example\.com \S+ 19-10-2026$/);
});

test('existing Devanagari passes through untouched', async () => {
  assert.equal((await transliterate('स्नेहल')).text, 'स्नेहल');
});

test('falls back to the offline engine when the provider is down', async () => {
  process.env.TRANSLITERATION_GOOGLE_URL = 'http://127.0.0.1:1/request';
  const result = await transliterate('Snehal');
  assert.equal(result.source, 'offline');
  assert.equal(result.text, 'स्नेहल');
});

test('unknown upstream response falls back per word and reports mixed', async () => {
  const result = await transliterate('Snehal zzz');
  assert.equal(result.source, 'mixed');
  assert.ok(result.text.startsWith('स्नेहल '));
});

test('provider "google" reports an error instead of falling back', async () => {
  process.env.TRANSLITERATION_PROVIDER = 'google';
  process.env.TRANSLITERATION_GOOGLE_URL = 'http://127.0.0.1:1/request';
  await assert.rejects(() => transliterate('Snehal'), { statusCode: 503 });
});

test('provider "offline" never calls upstream', async () => {
  process.env.TRANSLITERATION_PROVIDER = 'offline';
  assert.equal((await transliterate('Snehal')).source, 'offline');
  assert.equal(upstreamHits, 0);
});

test('rejects oversized input', async () => {
  await assert.rejects(() => transliterate('a'.repeat(1001)), { statusCode: 400 });
  await assert.rejects(() => transliterate(42), { statusCode: 400 });
});

test('offline engine: conjuncts, matras and long vowels', () => {
  assert.equal(transliterateWord('Snehal'), 'स्नेहल');
  assert.equal(transliterateWord('Sneha'), 'स्नेहा');
  assert.equal(transliterateWord('Raam'), 'राम');
  assert.equal(transliterateWord('Krishna'), 'क्रिष्ना');
});

test('protected-token detection', () => {
  assert.equal(isProtectedToken('Snehal'), false);
  assert.equal(isProtectedToken('Snehal123'), false);
  assert.equal(isProtectedToken('MH12AB1234'), true);
});

test('registry: only human-readable text fields get a Marathi companion', () => {
  const index = new Map();
  for (const m of modules) for (const s of m.submodules) index.set(s.key, s);

  const reg = index.get('factoryRegistration').fields;
  const translit = (name) => reg.find((f) => f.name === name).translit;
  for (const yes of ['name', 'legalEntity', 'addressLine1', 'village', 'district', 'state', 'contactPerson', 'remarks']) assert.equal(translit(yes), true, yes);
  for (const no of ['code', 'registrationNo', 'gstin', 'pan', 'licenseNo', 'pincode', 'website', 'crushingCapacityTcd', 'season', 'registeredOn', 'contactPhone', 'contactEmail', 'status']) assert.equal(translit(no), false, no);

  // Nothing numeric, date, select, ref, email or phone ever gets a companion.
  for (const s of index.values()) {
    for (const f of s.fields) {
      if (f.translit) assert.ok(['string', 'text'].includes(f.type), `${s.key}.${f.name}`);
    }
  }
});

test('validation accepts Marathi companions only for transliterable fields', () => {
  const fields = modules.find((m) => m.key === 'organization').submodules.find((s) => s.key === 'factoryRegistration').fields;
  const { errors, value } = validatePayload(fields, { name: 'Snehal', nameMr: ' स्नेहल ', gstinMr: 'x', codeMr: 'x' }, { partial: true });
  assert.deepEqual(errors, []);
  assert.equal(value.nameMr, 'स्नेहल');
  assert.equal('gstinMr' in value, false);
  assert.equal('codeMr' in value, false);
});
