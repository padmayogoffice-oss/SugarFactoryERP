/**
 * Interconnection - end-to-end through the real HTTP routes and a real MongoDB
 * (the per-entity controllers and routers, with the interconnection plugin).
 *
 * Needs a database; skipped unless TEST_MONGO_URI is set, e.g.
 *   TEST_MONGO_URI="mongodb://127.0.0.1:27017" npm test
 * A throw-away database is created and dropped. Works on a standalone mongod
 * (compensating rollback path) and on a replica set / Atlas (transaction path).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import { signAccessToken } from '../src/services/tokenService.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import { buildApiRouter } from '../src/routes/index.js';
import { modules } from '../src/registry/index.js';
import { inventoryReport } from '../src/services/reportService.js';

const URI = process.env.TEST_MONGO_URI;
const skip = URI ? false : 'set TEST_MONGO_URI to run the database integration tests';

const moduleOf = {};
const submoduleOf = {};
for (const moduleDef of modules) for (const submodule of moduleDef.submodules) {
  moduleOf[submodule.key] = moduleDef.key;
  submoduleOf[submodule.key] = submodule;
}

const admin = { _id: new mongoose.Types.ObjectId(), status: 'active', isSuperAdmin: true, roles: [], passwordChangedAt: null, isLocked: () => false };
const nobody = { ...admin, _id: new mongoose.Types.ObjectId(), isSuperAdmin: false };
const originalFindById = User.findById;
let server; let base; let adminToken; let nobodyToken;
const ctx = {};
let n = 0;

before(async () => {
  if (!URI) return;
  mongoose.set('strictQuery', true); // as in config/connectDB.js
  await mongoose.connect(URI, { dbName: `erp_it_${Date.now()}` });
  await Promise.all(Object.values(mongoose.models).map((model) => model.init())); // unique indexes must exist
  User.findById = async (id) => (String(id) === String(nobody._id) ? nobody : admin);
  adminToken = signAccessToken(admin);
  nobodyToken = signAccessToken(nobody);
  const app = express();
  app.use(express.json());
  app.use('/api', buildApiRouter());
  app.use(errorHandler);
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  User.findById = originalFindById;
  if (server) server.close();
  if (URI) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

async function call(method, path, body, token = adminToken) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

/** Smallest valid payload for a submodule; references must be supplied. */
function minimal(key, overrides = {}) {
  const payload = {};
  n += 1;
  for (const field of submoduleOf[key].fields) {
    if (field.readOnly || field.autoNumber || !field.required || field.default !== undefined) continue;
    if (field.type === 'ref') {
      if (overrides[field.name]) continue;
      throw new Error(`${key}.${field.name} is a required reference - pass it in overrides`);
    }
    if (field.options) payload[field.name] = field.options[0];
    else if (['number', 'decimal', 'currency', 'percent'].includes(field.type)) payload[field.name] = 10;
    else if (field.type === 'date') payload[field.name] = '2026-08-15';
    else if (field.type === 'email') payload[field.name] = `t${n}@example.com`;
    else if (field.type === 'phone') payload[field.name] = '9876543210';
    else if (field.type === 'boolean') payload[field.name] = true;
    else payload[field.name] = `${field.name}-${n}`;
  }
  return { ...payload, ...overrides };
}

async function make(key, overrides = {}) {
  const response = await call('POST', `/${moduleOf[key]}/${key}`, minimal(key, overrides));
  assert.equal(response.status, 201, `create ${key}: ${JSON.stringify(response.body)}`);
  return response.body.data;
}
const get = async (key, id) => (await call('GET', `/${moduleOf[key]}/${key}/${id}`)).body.data;
const put = (key, id, body) => call('PUT', `/${moduleOf[key]}/${key}/${id}`, body);
const del = (key, id) => call('DELETE', `/${moduleOf[key]}/${key}/${id}`);
const options = async (key, query = '') => (await call('GET', `/${moduleOf[key]}/${key}/options${query}`)).body.data;
const ledger = (filter = {}) => mongoose.models.StockLedger.find(filter).lean();
const balance = async (item, warehouse) => {
  const rows = await ledger({ item, warehouse });
  return rows.reduce((sum, row) => sum + row.inQty - row.outQty, 0);
};

/* ----------------------------------------------------------- identifiers --- */

test('generated identifiers: created by the backend, sequential, ignored when sent by the client', { skip }, async () => {
  const first = await make('farmer', { code: 'HACKED' });
  const second = await make('farmer');
  assert.equal(first.code, 'FRM-00001');
  assert.equal(second.code, 'FRM-00002');
  ctx.farmer = first;
  ctx.farmer2 = second;
});

test('identifiers are preserved when a record is edited', { skip }, async () => {
  const response = await put('farmer', ctx.farmer._id, { name: 'Renamed Farmer', code: 'CHANGED' });
  assert.equal(response.status, 200);
  assert.equal(response.body.data.code, 'FRM-00001');
  assert.equal(response.body.data.name, 'Renamed Farmer');
});

test('50 concurrent creates never produce a duplicate identifier', { skip }, async () => {
  const created = await Promise.all(Array.from({ length: 50 }, () => call('POST', '/cane/farmer', minimal('farmer'))));
  assert.ok(created.every((r) => r.status === 201), JSON.stringify(created.find((r) => r.status !== 201)?.body));
  const codes = created.map((r) => r.body.data.code);
  assert.equal(new Set(codes).size, 50);
  assert.equal(new Set(codes).size, (await mongoose.models.Farmer.distinct('code')).length - 2, 'database agrees');
});

test('legacy hand-typed numbers: counter catches up instead of failing', { skip }, async () => {
  const Farmer = mongoose.models.Farmer;
  const top = (await Farmer.find().lean()).map((f) => Number(f.code.split('-')[1])).reduce((a, b) => Math.max(a, b), 0);
  // A record created outside the API takes the number the counter would hand out next.
  await Farmer.collection.insertOne({ code: `FRM-${String(top + 1).padStart(5, '0')}`, name: 'Legacy', status: 'active' });
  const next = await make('farmer');
  assert.equal(next.code, `FRM-${String(top + 2).padStart(5, '0')}`);
});

test('Document Numbering rules override the default format', { skip }, async () => {
  await call('POST', '/settings/documentNumbering', { code: 'caneRate', name: 'Cane rate', prefix: 'RATE', padding: 3, includeYear: false });
  const rate = await make('caneRate');
  assert.equal(rate.rateCode, 'RATE-001');
});

test('transactions are numbered per financial year', { skip }, async () => {
  const contract = await make('caneContract', { farmer: ctx.farmer._id });
  assert.match(contract.contractNo, /^CNT-\d{4}-00001$/);
  ctx.contract = contract;
});

/* ------------------------------------------------------------ references --- */

test('references must exist', { skip }, async () => {
  const response = await call('POST', '/cane/caneContract', minimal('caneContract', { farmer: new mongoose.Types.ObjectId().toString() }));
  assert.equal(response.status, 400);
  assert.match(JSON.stringify(response.body.error.details), /does not exist/);
});

test('inactive masters cannot be picked for new records', { skip }, async () => {
  const inactive = await make('farmer', { status: 'inactive' });
  const response = await call('POST', '/cane/caneContract', minimal('caneContract', { farmer: inactive._id }));
  assert.equal(response.status, 400);
  assert.match(JSON.stringify(response.body.error.details), /inactive/);
});

test('linked records must agree: an indent cannot pair a farmer with another farmer\'s contract', { skip }, async () => {
  const bad = await call('POST', '/cane/caneIndent', minimal('caneIndent', { farmer: ctx.farmer2._id, contract: ctx.contract._id }));
  assert.equal(bad.status, 400);
  assert.match(JSON.stringify(bad.body.error.details), /does not match/);
  const good = await make('caneIndent', { farmer: ctx.farmer._id, contract: ctx.contract._id });
  assert.match(good.indentNo, /^IND-/);
  ctx.indent = good;
  const edit = await put('caneIndent', good._id, { farmer: ctx.farmer2._id });
  assert.equal(edit.status, 400, 'changing only the farmer is caught too');
});

test('full cane chain saves with intact foreign keys: farmer > contract > indent > gate entry > weighment > quality > payment', { skip }, async () => {
  const vehicle = await make('vehicle', { vehicleNo: `MH12-${Date.now() % 10000}` });
  const gate = await make('caneGateEntry', { farmer: ctx.farmer._id, indent: ctx.indent._id, vehicle: vehicle._id });
  const weigh = await make('caneWeighment', { farmer: ctx.farmer._id, gateEntry: gate._id, vehicle: vehicle._id, grossWeightMt: 20, tareWeightMt: 8 });
  const quality = await make('caneQuality', { farmer: ctx.farmer._id, weighment: weigh._id, polPercent: 15, brixPercent: 18 });
  const pay = await make('canePayment', { farmer: ctx.farmer._id, contract: ctx.contract._id, totalQtyMt: 12, averageRatePerMt: 3000, deductionAmount: 500 });
  const stored = await get('canePayment', pay._id);
  assert.equal(String(stored.farmer._id), ctx.farmer._id);
  assert.equal(stored.grossAmount, 36000);
  assert.equal(stored.netAmount, 35500);
  assert.equal((await get('caneWeighment', weigh._id)).netWeightMt, 12);
  assert.equal(String((await get('caneQuality', quality._id)).weighment._id), weigh._id);
  assert.equal(String((await get('caneGateEntry', gate._id)).indent._id), ctx.indent._id);
});

/* ---------------------------------------------------------- delete guard --- */

test('records in use cannot be deleted (no orphans); unused ones can', { skip }, async () => {
  const blocked = await del('farmer', ctx.farmer._id);
  assert.equal(blocked.status, 409);
  assert.match(blocked.body.error.message, /used by/);
  assert.match(blocked.body.error.message, /Cane Contract/);
  const spare = await make('farmer');
  assert.equal((await del('farmer', spare._id)).status, 200);
});

/* --------------------------------------------------------------- options --- */

test('options: search, exact id lookup, parent filter, > 50 records, declared values only', { skip }, async () => {
  await mongoose.models.Item.insertMany(Array.from({ length: 70 }, (_, i) => ({ code: `BULK-${i}`, name: `Bulk ${i}`, category: 'Consumable', uom: 'Nos', status: 'active' })));
  assert.equal((await options('item', '?limit=100&q=BULK')).length, 70, 'not capped at 50');
  assert.equal((await options('item', '?q=BULK-69')).length, 1, 'item 70 is findable by search');
  const [one] = await options('item', '?q=BULK-5');
  assert.equal((await options('item', `?ids=${one.id}`))[0].id, one.id, 'selected record resolves by id');
  assert.ok(one.description, 'shows the name next to the code');

  const farmerContracts = await options('caneContract', `?farmer=${ctx.farmer._id}`);
  assert.deepEqual(farmerContracts.map((c) => c.id), [ctx.contract._id]);
  assert.equal(farmerContracts[0].values.farmer, ctx.farmer._id, 'carries the farmer so a form can auto-fill it');
  assert.deepEqual((await options('caneContract', `?farmer=${ctx.farmer2._id}`)), []);

  const farmerOption = (await options('farmer', `?ids=${ctx.farmer._id}`))[0];
  assert.deepEqual(Object.keys(farmerOption.values), [], 'no sensitive fields leak');
  assert.deepEqual((await options('farmer', '?farmer=not-an-id')).length > 0, true, 'junk filters ignored');
});

test('list search still works', { skip }, async () => {
  const found = await call('GET', '/cane/farmer?q=Renamed');
  assert.equal(found.body.data.length, 1);
});

/* ------------------------------------------------- derived + stock posting --- */

test('procurement: derived totals are stored and recomputed on edit', { skip }, async () => {
  ctx.supplier = await make('supplier');
  ctx.item = await make('item', { uom: 'Kg' });
  ctx.wh = await make('warehouse', { factoryUnit: undefined });
  ctx.wh2 = await make('warehouse');
  const po = await make('purchaseOrder', { supplier: ctx.supplier._id, item: ctx.item._id, quantity: 10, rate: 100, discountPercent: 10, taxPercent: 18, freightAmount: 50, warehouse: ctx.wh._id });
  assert.match(po.poNo, /^PO-/);
  const stored = await mongoose.models.PurchaseOrder.findById(po._id).lean();
  assert.deepEqual([stored.subTotal, stored.taxAmount, stored.totalAmount], [900, 162, 1112], 'persisted, so reports can sum them');
  const edited = await put('purchaseOrder', po._id, { quantity: 20 });
  assert.equal(edited.body.data.totalAmount, 2174);
  assert.equal(edited.body.data.poNo, po.poNo);
  assert.equal(String(edited.body.data.supplier._id), ctx.supplier._id);
  ctx.po = edited.body.data;
});

test('goods receipt: PO must match supplier; ordered qty snapshot; drafts do not move stock', { skip }, async () => {
  const other = await make('supplier');
  const wrong = await call('POST', '/procurement/goodsReceipt', minimal('goodsReceipt', { purchaseOrder: ctx.po._id, supplier: other._id, item: ctx.item._id, warehouse: ctx.wh._id }));
  assert.equal(wrong.status, 400);
  const grn = await make('goodsReceipt', { purchaseOrder: ctx.po._id, supplier: ctx.supplier._id, item: ctx.item._id, warehouse: ctx.wh._id, receivedQty: 20, acceptedQty: 18, rejectedQty: 2, rate: 90 });
  const stored = await mongoose.models.GoodsReceipt.findById(grn._id).lean();
  assert.equal(stored.orderedQty, 20);
  assert.equal(stored.totalAmount, 1620);
  assert.equal((await ledger()).filter((r) => r.referenceNo === grn.grnNo).length, 0);
  ctx.grn = grn;
});

test('posting a goods receipt updates the stock ledger once, however often it is edited', { skip }, async () => {
  assert.equal((await put('goodsReceipt', ctx.grn._id, { status: 'posted' })).status, 200);
  let rows = await ledger({ referenceNo: ctx.grn.grnNo });
  assert.equal(rows.length, 1);
  assert.deepEqual([rows[0].transactionType, rows[0].inQty, rows[0].value, rows[0].sourceModel], ['Receipt', 18, 1620, 'GoodsReceipt']);
  assert.equal(await balance(ctx.item._id, ctx.wh._id), 18);

  await put('goodsReceipt', ctx.grn._id, { acceptedQty: 15, remarks: 'recount' });
  await put('goodsReceipt', ctx.grn._id, { remarks: 'again' });
  rows = await ledger({ referenceNo: ctx.grn.grnNo });
  assert.equal(rows.length, 1, 'no duplicate rows');
  assert.equal(await balance(ctx.item._id, ctx.wh._id), 15);
});

test('reports read the same stock: inventory report matches the ledger', { skip }, async () => {
  const report = await inventoryReport({});
  const line = report.stock.find((row) => row.warehouse === ctx.wh.name && row.item === ctx.item.name);
  assert.equal(line.balanceQty, 15);
  assert.equal(line.value, 1350, 'stock value is real, not zero');
});

test('material issue reduces stock; over-issue is refused and leaves nothing behind', { skip }, async () => {
  const before = await mongoose.models.MaterialIssue.countDocuments();
  const dept = await make('department');
  const tooMuch = await call('POST', '/stores/materialIssue', minimal('materialIssue', { warehouse: ctx.wh._id, department: dept._id, item: ctx.item._id, quantity: 99, rate: 90, status: 'posted' }));
  assert.equal(tooMuch.status, 400);
  assert.match(tooMuch.body.error.message, /Insufficient stock/);
  assert.equal(await mongoose.models.MaterialIssue.countDocuments(), before, 'document rolled back');
  assert.equal(await balance(ctx.item._id, ctx.wh._id), 15);

  const issue = await make('materialIssue', { warehouse: ctx.wh._id, department: dept._id, item: ctx.item._id, quantity: 10, rate: 90, status: 'posted' });
  assert.equal(await balance(ctx.item._id, ctx.wh._id), 5);
  ctx.issue = issue;
});

test('a receipt that has been consumed cannot be un-posted or deleted', { skip }, async () => {
  const unpost = await put('goodsReceipt', ctx.grn._id, { status: 'cancelled' });
  assert.equal(unpost.status, 400);
  assert.equal((await get('goodsReceipt', ctx.grn._id)).status, 'posted', 'unchanged');
  assert.equal(await balance(ctx.item._id, ctx.wh._id), 5, 'ledger unchanged');
  assert.equal((await del('goodsReceipt', ctx.grn._id)).status, 400);
});

test('deleting a posted issue puts the stock back', { skip }, async () => {
  assert.equal((await del('materialIssue', ctx.issue._id)).status, 200);
  assert.equal(await balance(ctx.item._id, ctx.wh._id), 15);
  assert.equal((await ledger({ referenceNo: ctx.issue.issueNo })).length, 0);
});

test('auto-posted ledger rows are protected from manual edits', { skip }, async () => {
  const [row] = await ledger({ referenceNo: ctx.grn.grnNo });
  assert.equal((await put('stockLedger', row._id, { inQty: 999 })).status, 409);
  assert.equal((await del('stockLedger', row._id)).status, 409);
});

test('stock transfer posts out of one warehouse and into the other', { skip }, async () => {
  const transfer = await make('stockTransfer', { fromWarehouse: ctx.wh._id, toWarehouse: ctx.wh2._id, item: ctx.item._id, quantity: 6, rate: 90, status: 'posted' });
  assert.equal(await balance(ctx.item._id, ctx.wh._id), 9);
  assert.equal(await balance(ctx.item._id, ctx.wh2._id), 6);
  assert.equal((await ledger({ referenceNo: transfer.transferNo })).length, 2);
});

test('production: bagging and by-products post finished goods to stock when a product is linked', { skip }, async () => {
  const sugar = await make('item', { category: 'Finished Goods', uom: 'MT' });
  const bagging = await make('sugarBagging', { item: sugar._id, warehouse: ctx.wh._id, bagsCount: 400, bagWeightKg: 50, status: 'posted' });
  assert.equal((await mongoose.models.SugarBagging.findById(bagging._id).lean()).totalQtyMt, 20);
  assert.equal(await balance(sugar._id, ctx.wh._id), 20);
  const unlinked = await make('byProduct', { warehouse: ctx.wh._id, status: 'posted' });
  assert.equal((await ledger({ referenceNo: unlinked.entryNo })).length, 0, 'no product linked, no stock movement');
});

test('maintenance: spare consumption links equipment and breakdown, and issues stock', { skip }, async () => {
  const equipment = await make('equipment');
  const breakdown = await make('breakdownMaintenance', { equipment: equipment._id });
  const spare = await make('spareConsumption', { equipment: equipment._id, breakdown: breakdown._id, item: ctx.item._id, issuedFrom: ctx.wh._id, quantity: 2, rate: 90 });
  assert.equal((await mongoose.models.SpareConsumption.findById(spare._id).lean()).totalValue, 180);
  assert.equal(await balance(ctx.item._id, ctx.wh._id), 7);
  assert.equal((await del('equipment', equipment._id)).status, 409, 'equipment with history cannot be deleted');
});

/* ------------------------------------------------------------- HR / sales --- */

test('HR: employee code generated; attendance auto-fill data available; deletion guarded', { skip }, async () => {
  const dept = await make('department');
  const designation = await make('designation', { department: dept._id });
  const employee = await make('employee', { department: dept._id, designation: designation._id });
  assert.match(employee.employeeCode, /^EMP-00001$/);
  const opts = await options('employee', `?ids=${employee._id}`);
  assert.equal(opts[0].values.department, dept._id, 'attendance can auto-fill the department');
  await make('attendance', { employee: employee._id, department: dept._id });
  assert.equal((await del('employee', employee._id)).status, 409);
});

test('sales: customer > order > dispatch consistency', { skip }, async () => {
  const customerA = await make('customer');
  const customerB = await make('customer');
  const product = await make('item', { category: 'Finished Goods' });
  const order = await make('salesOrder', { customer: customerA._id, product: product._id, quantityMt: 2, rate: 40000, taxPercent: 5 });
  assert.equal((await mongoose.models.SalesOrder.findById(order._id).lean()).totalAmount, 84000);
  const bad = await call('POST', '/sales/dispatch', minimal('dispatch', { salesOrder: order._id, customer: customerB._id }));
  assert.equal(bad.status, 400);
  const dispatch = await make('dispatch', { salesOrder: order._id, customer: customerA._id });
  assert.match(dispatch.dispatchNo, /^DSP-/);
});

/* ------------------------------------------------------------- security --- */

test('existing authentication and permissions still apply to the new behaviour', { skip }, async () => {
  assert.equal((await call('GET', '/cane/farmer/options', undefined, null)).status, 401);
  assert.equal((await call('GET', '/cane/farmer/options', undefined, nobodyToken)).status, 403);
  assert.equal((await call('POST', '/cane/farmer', minimal('farmer'), nobodyToken)).status, 403);
  assert.equal((await call('DELETE', `/cane/farmer/${ctx.farmer._id}`, undefined, nobodyToken)).status, 403);
});