/**
 * Interconnection - pure logic (no database needed).
 * Registry layers, generated identifier formats, derived formulas, payload rules.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { modules, toClientTree } from '../src/registry/index.js';
import { buildResourceModels } from '../src/models/resourceModel.js';
import { NUMBERING } from '../src/registry/numbering.js';
import { SCALAR_FILL, EXTENSIONS } from '../src/registry/relations.js';
import { DERIVE, deriveValues } from '../src/registry/derived.js';
import { validatePayload } from '../src/validators/fieldValidator.js';
import { toClientSchema } from '../src/registry/fields.js';
import { financialYearLabel, formatNumber } from '../src/services/numberingService.js';
import { POSTERS } from '../src/services/postingService.js';

const all = modules.flatMap((moduleDef) => moduleDef.submodules.map((submodule) => ({ moduleDef, submodule })));
const byKey = (key) => all.find((entry) => entry.submodule.key === key).submodule;

test('every submodule in the numbering map has a generated field that is unique + required', () => {
  for (const key of Object.keys(NUMBERING)) {
    const submodule = byKey(key);
    const field = submodule.fields.find((item) => item.name === submodule.autoNumberField);
    assert.ok(field?.autoNumber, `${key}: not marked autoNumber`);
    assert.ok(field.unique, `${key}.${field.name} must be unique so concurrent creates cannot duplicate it`);
    assert.equal(field.type, 'string');
  }
});

test('the 63 generated identifiers cover the examples in the brief', () => {
  assert.equal(Object.keys(NUMBERING).length, 63);
  for (const key of ['employee', 'farmer', 'caneContract', 'caneIndent', 'caneGateEntry', 'caneWeighment', 'purchaseOrder', 'goodsReceipt', 'salesOrder', 'salesInvoice', 'paymentVoucher', 'breakdownMaintenance', 'qualityInspection']) {
    assert.ok(NUMBERING[key], `${key} should be generated`);
  }
});

test('client payloads can never set or change a generated identifier', () => {
  const farmer = byKey('farmer');
  const { errors, value } = validatePayload(farmer.fields, { name: 'Ramesh', code: 'HACKED' });
  assert.ok(!errors.some((message) => /code/i.test(message)), 'code must not be required from the client');
  assert.equal(value.code, undefined);
  const update = validatePayload(farmer.fields, { code: 'HACKED' }, { partial: true });
  assert.equal(update.value.code, undefined);
});

test('navigation exposes entity-level hints and leaves field metadata untouched', () => {
  const tree = toClientTree();
  const farmer = tree.find((m) => m.key === 'cane').submodules.find((x) => x.key === 'farmer');
  assert.equal(farmer.autoNumberField, 'code');
  const indent = tree.find((m) => m.key === 'cane').submodules.find((x) => x.key === 'caneIndent');
  assert.deepEqual(indent.relations.filterBy.contract, ['farmer']);
  // Page field lists are checked against toClientSchema, so it must not gain keys.
  const keys = new Set(toClientSchema(byKey('farmer').fields).flatMap((field) => Object.keys(field)));
  assert.ok(!keys.has('autoNumber') && !keys.has('persist') && !keys.has('refModule'));
});

test('every entity model has the fields the registry now declares (links, stored totals, ledger source)', () => {
  const models = buildResourceModels();
  for (const { submodule } of all) {
    const { model } = models.get(submodule.key);
    for (const field of submodule.fields) {
      if (field.readOnly && !field.persist) continue;
      assert.ok(model.schema.path(field.name), `${submodule.key}.${field.name} missing from the model schema`);
    }
  }
  const ledger = models.get('stockLedger').model.schema;
  assert.ok(ledger.path('sourceModel') && ledger.path('sourceId'));
});

test('the plugin is attached to entity models only, and indexes their foreign keys', () => {
  const models = buildResourceModels();
  const indexed = (key) => models.get(key).model.schema.indexes().map(([fields]) => Object.keys(fields)[0]);
  assert.ok(indexed('caneIndent').includes('farmer'));
  assert.ok(indexed('goodsReceipt').includes('purchaseOrder'));
  assert.ok(!indexed('caneIndent').includes('createdBy'), 'audit stamps are not indexed');
});

test('missing links were added as optional references (existing records stay valid)', () => {
  for (const [key, additions] of Object.entries(EXTENSIONS)) {
    for (const addition of additions) {
      const field = byKey(key).fields.find((item) => item.name === addition.name);
      assert.ok(field, `${key}.${addition.name} missing`);
      assert.equal(field.type, 'ref');
      assert.ok(!field.required, `${key}.${addition.name} must stay optional`);
    }
  }
});

test('cascading filters and auto-fill follow the real workflows', () => {
  const indent = byKey('caneIndent').relations;
  assert.deepEqual(indent.filterBy.contract, ['farmer'], 'choosing a farmer narrows contracts');
  assert.equal(indent.autofill.contract.farmer, 'farmer', 'choosing a contract fills the farmer');

  const grn = byKey('goodsReceipt').relations;
  assert.deepEqual(grn.autofill.purchaseOrder, { supplier: 'supplier', item: 'item', warehouse: 'warehouse', uom: 'uom', rate: 'rate' });
  assert.deepEqual(grn.identity.purchaseOrder.sort(), ['item', 'supplier']);

  const dispatch = byKey('dispatch').relations;
  assert.equal(dispatch.autofill.salesOrder.customer, 'customer');
  assert.equal(dispatch.autofill.vehicle.transporter, 'transporter');
  assert.equal(dispatch.autofill.vehicle.driverName, 'driverName');

  assert.equal(byKey('attendance').relations.autofill.employee.department, 'department');
  assert.equal(byKey('breakdownMaintenance').relations.autofill.equipment, undefined, 'equipment has no parents to copy');
});

test('every submodule that other forms copy from exposes only the declared fields', () => {
  const po = byKey('purchaseOrder');
  assert.ok(po.exposedFields.includes('supplier') && po.exposedFields.includes('rate'));
  assert.ok(!po.exposedFields.includes('remarks'), 'unrelated fields are never exposed');
  assert.ok(!byKey('farmer').exposedFields.includes('aadhaarNo'));
  assert.ok(!byKey('employee').exposedFields.includes('panNo'));
});

test('SCALAR_FILL entries all point at real fields', () => {
  for (const key of Object.keys(SCALAR_FILL)) {
    const [subKey, fieldName] = key.split('.');
    assert.ok(byKey(subKey).fields.some((field) => field.name === fieldName && field.type === 'ref'), key);
  }
});

test('financial year label follows April-March', () => {
  assert.equal(financialYearLabel(new Date('2026-04-01T10:00:00')), '2627');
  assert.equal(financialYearLabel(new Date('2026-03-31T10:00:00')), '2526');
  assert.equal(financialYearLabel(new Date('2026-12-15T10:00:00')), '2627');
  assert.equal(financialYearLabel(new Date('2027-01-05T10:00:00')), '2627');
});

test('identifier format', () => {
  assert.equal(formatNumber({ prefix: 'PO', fy: '2627', seq: 12 }), 'PO-2627-00012');
  assert.equal(formatNumber({ prefix: 'FRM', seq: 7 }), 'FRM-00007');
  assert.equal(formatNumber({ prefix: 'ORD', padding: 3, suffix: 'X', seq: 5 }), 'ORD-005-X');
  assert.equal(formatNumber({ prefix: 'INV', fy: '2627', seq: 123456 }), 'INV-2627-123456', 'never truncates');
});

test('derived formulas: purchase order, goods receipt, cane payment, bagging, ledger', () => {
  assert.deepEqual(deriveValues('purchaseOrder', { quantity: 10, rate: 100, discountPercent: 10, taxPercent: 18, freightAmount: 50 }), { subTotal: 900, taxAmount: 162, totalAmount: 1112 });
  assert.deepEqual(deriveValues('salesOrder', { quantityMt: 2, rate: 40000, discountPercent: 0, taxPercent: 5 }), { subTotal: 80000, taxAmount: 4000, totalAmount: 84000 });
  assert.equal(deriveValues('goodsReceipt', { acceptedQty: 8, rate: 12.5 }).totalAmount, 100);
  assert.equal(deriveValues('goodsReceipt', { receivedQty: 10, rejectedQty: 2, rate: 10 }).totalAmount, 80, 'accepted = received - rejected when not given');
  assert.deepEqual(deriveValues('canePayment', { totalQtyMt: 20, averageRatePerMt: 3150, deductionAmount: 1000 }), { grossAmount: 63000, netAmount: 62000 });
  assert.equal(deriveValues('sugarBagging', { bagsCount: 200, bagWeightKg: 50 }).totalQtyMt, 10);
  assert.equal(deriveValues('stockLedger', { inQty: 10, outQty: 4, rate: 5 }).value, 30);
  assert.equal(deriveValues('stockLedger', { inQty: 0, outQty: 4, rate: 5 }).value, -20, 'issues reduce stock value');
  assert.deepEqual(deriveValues('farmer', {}), {}, 'unknown submodules derive nothing');
  assert.ok(Object.keys(DERIVE).length >= 13);
});

test('derived fields are persisted but still never accepted from clients', () => {
  const po = byKey('purchaseOrder');
  const total = po.fields.find((field) => field.name === 'totalAmount');
  assert.equal(total.persist, true);
  assert.equal(total.readOnly, true);
  const { value } = validatePayload(po.fields, { totalAmount: 1 }, { partial: true });
  assert.equal(value.totalAmount, undefined);
});

test('stock posting rules: which documents post, and what they post', async () => {
  assert.deepEqual(Object.keys(POSTERS).sort(), ['byProduct', 'goodsReceipt', 'materialIssue', 'purchaseReturn', 'spareConsumption', 'stockAdjustment', 'stockTransfer', 'sugarBagging', 'stockTransfer'].sort().filter((v, i, a) => a.indexOf(v) === i));
  const grn = { status: 'draft', item: 'i', warehouse: 'w', acceptedQty: 5, rate: 2 };
  assert.equal(POSTERS.goodsReceipt.active(grn), false, 'drafts do not move stock');
  assert.equal(POSTERS.goodsReceipt.active({ ...grn, status: 'posted' }), true);

  const [line] = POSTERS.goodsReceipt.lines({ ...grn, status: 'posted' });
  assert.equal(line.inQty, 5);
  assert.equal(line.transactionType, 'Receipt');

  const transfer = POSTERS.stockTransfer.lines({ status: 'posted', item: 'i', fromWarehouse: 'a', toWarehouse: 'b', quantity: 3, rate: 1 });
  assert.deepEqual(transfer.map((row) => [row.warehouse, row.inQty || 0, row.outQty || 0]), [['a', 0, 3], ['b', 3, 0]]);

  const [decrease] = POSTERS.stockAdjustment.lines({ item: 'i', warehouse: 'w', adjustmentType: 'Decrease', quantity: 2 });
  assert.equal(decrease.outQty, 2);
  assert.equal(decrease.inQty, 0);

  assert.equal(POSTERS.byProduct.active({ status: 'posted' }), false, 'by-product needs a linked product to post');
  assert.equal(POSTERS.spareConsumption.active({ item: 'i' }), false, 'spares need a store to issue from');
});