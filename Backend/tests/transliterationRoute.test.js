import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Role from '../src/models/Role.js';
import { signAccessToken } from '../src/services/tokenService.js';
import transliterationRoutes from '../src/routes/transliterationRoutes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { buildResourceModels } from '../src/models/resourceModel.js';

// No database is needed: authentication is satisfied by stubbing the user lookup.
const stubUser = { _id: new mongoose.Types.ObjectId(), status: 'active', isSuperAdmin: true, roles: [], passwordChangedAt: null, isLocked: () => false };
const originalFindById = User.findById;
let server;
let base;
let token;

before(async () => {
  process.env.TRANSLITERATION_PROVIDER = 'offline'; // deterministic, no network
  User.findById = async () => stubUser;
  token = signAccessToken(stubUser);
  const app = express();
  app.use(express.json());
  app.use('/api/transliterate', transliterationRoutes);
  app.use(errorHandler);
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}/api/transliterate`;
});

after(() => {
  User.findById = originalFindById;
  server.close();
});

const post = (body, auth = true) =>
  fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });

test('requires authentication', async () => {
  assert.equal((await post({ text: 'Snehal' }, false)).status, 401);
});

test('returns the standard envelope with transliterated text', async () => {
  const response = await post({ text: 'Snehal 12345 snehal@example.com' });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.text, 'स्नेहल 12345 snehal@example.com');
  assert.equal(body.data.source, 'offline');
});

test('rejects non-string and oversized text with 400', async () => {
  assert.equal((await post({ text: 5 })).status, 400);
  assert.equal((await post({})).status, 400);
  assert.equal((await post({ text: 'a'.repeat(1001) })).status, 400);
});

test('generated resource schemas store Marathi companions only for text fields', () => {
  const models = buildResourceModels();
  const { model } = models.get('factoryRegistration');
  assert.ok(model.schema.path('nameMr'));
  assert.ok(model.schema.path('remarksMr'));
  for (const machine of ['codeMr', 'gstinMr', 'panMr', 'registrationNoMr', 'crushingCapacityTcdMr', 'registeredOnMr']) {
    assert.equal(model.schema.path(machine), undefined, machine);
  }
  const doc = new model({ code: 'X', name: 'Snehal', nameMr: 'स्नेहल', gstinMr: 'ignored' });
  assert.equal(doc.nameMr, 'स्नेहल');
  assert.equal(doc.gstinMr, undefined);
  // The existing English fields are untouched.
  assert.equal(doc.name, 'Snehal');
});

test('hand-written User and Role models carry optional Marathi fields', () => {
  for (const path of ['firstNameMr', 'lastNameMr', 'remarksMr']) assert.ok(User.schema.path(path), path);
  for (const path of ['nameMr', 'descriptionMr']) assert.ok(Role.schema.path(path), path);
  assert.equal(User.schema.path('firstNameMr').isRequired, undefined);
});

test('backfill fills only missing Marathi values and never touches English fields', async () => {
  const { backfillModel } = await import('../src/seed/backfillMarathi.js');
  const docs = [{ _id: 1, name: 'Snehal' }, { _id: 2, name: '12345' }];
  const writes = [];
  const model = {
    find: () => ({ select: () => ({ lean: () => ({ cursor: async function* cursor() { yield* docs; } }) }) }),
    bulkWrite: async (ops) => writes.push(...ops),
  };
  const submodule = { key: 'department', fields: [{ name: 'name', translit: true, marathiName: 'nameMr' }, { name: 'code', translit: false }] };
  const convert = async (text) => (/[A-Za-z]/.test(text) ? { text: 'स्नेहल', source: 'google' } : { text, source: 'none' });

  const summary = await backfillModel({ model, submodule, convert });
  assert.deepEqual(summary.name, { scanned: 2, updated: 1, failed: 0 });
  assert.deepEqual(writes, [{ updateOne: { filter: { _id: 1 }, update: { $set: { nameMr: 'स्नेहल' } } } }]);
  assert.equal(summary.code, undefined);

  writes.length = 0;
  await backfillModel({ model, submodule, convert, dryRun: true });
  assert.equal(writes.length, 0);
});
