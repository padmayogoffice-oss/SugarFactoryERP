/**
 * Cross-module relationships.
 *
 * 1. EXTENSIONS adds the optional reference fields that were missing from the
 *    registry, so the workflows below are connected end to end:
 *      Crushing Plan -> Shift Production, Equipment -> Plant Downtime,
 *      Breakdown / PM -> Spare Consumption, Sample -> Lab Test,
 *      GRN / PO / Cane Payment / Employee -> Payment Voucher,
 *      Sales Invoice -> Receipt Voucher, Contract -> Cane Payment,
 *      Item -> Sugar Bagging / By-Product (so production can post stock).
 *    All are optional and additive: existing records stay valid.
 *
 * 2. deriveRelations() works out, from the registry itself, how forms behave:
 *      filterBy  - which parent selection narrows a dropdown
 *                  (choosing Farmer narrows Contracts / Indents to that farmer)
 *      autofill  - which fields are copied from a picked record
 *                  (choosing a PO fills Supplier, Item, Warehouse, UOM, Rate)
 *      identity  - parent selections that must stay consistent on the server
 *                  (a GRN's supplier must be its PO's supplier)
 *    The same rules drive the UI and the server-side validation.
 */

const IDENTITY = new Set(['farmer', 'supplier', 'customer', 'employee', 'equipment', 'item']);

// New links are form-only (inList: false) so existing list columns do not move.
const ref = (name, label, model, after) => ({ name, label, type: 'ref', ref: model, inList: false, after });

const EXTENSIONS = {
  shiftProduction: [ref('crushingPlan', 'Crushing Plan', 'CrushingPlan', 'productionDate')],
  plantDowntime: [ref('equipment', 'Equipment', 'Equipment', 'section')],
  sugarBagging: [ref('item', 'Product (Item)', 'Item', 'grade')],
  byProduct: [ref('item', 'Product (Item)', 'Item', 'productType')],
  spareConsumption: [
    ref('breakdown', 'Breakdown Ticket', 'BreakdownMaintenance', 'equipment'),
    ref('preventive', 'Preventive Schedule', 'PreventiveMaintenance', 'breakdown'),
  ],
  assetRegister: [
    ref('equipment', 'Linked Equipment', 'Equipment', 'name'),
    ref('department', 'Department', 'Department', 'location'),
  ],
  labTest: [ref('sample', 'Sample', 'SampleCollection', 'testDate')],
  nonConformance: [ref('item', 'Item', 'Item', 'source')],
  canePayment: [ref('contract', 'Cane Contract', 'CaneContract', 'farmer')],
  paymentVoucher: [
    ref('employee', 'Employee', 'Employee', 'farmer'),
    ref('purchaseOrder', 'Purchase Order', 'PurchaseOrder', 'employee'),
    ref('goodsReceipt', 'Goods Receipt', 'GoodsReceipt', 'purchaseOrder'),
    ref('canePayment', 'Cane Payment', 'CanePayment', 'goodsReceipt'),
  ],
  receiptVoucher: [ref('salesInvoice', 'Sales Invoice', 'SalesInvoice', 'customer')],
};

/** Values copied from a picked record that are not themselves references. */
const SCALAR_FILL = {
  'purchaseRequisition.item': { uom: 'uom' },
  'purchaseOrder.item': { uom: 'uom' },
  'purchaseOrder.quotation': {
    quantity: 'quantity',
    rate: 'rate',
    discountPercent: 'discountPercent',
    taxPercent: 'taxPercent',
    freightAmount: 'freightAmount',
  },
  'goodsReceipt.item': { uom: 'uom' },
  'goodsReceipt.purchaseOrder': { uom: 'uom', rate: 'rate' },
  'purchaseReturn.goodsReceipt': { uom: 'uom', rate: 'rate' },
  'materialIssue.item': { uom: 'uom' },
  'stockTransfer.item': { uom: 'uom' },
  'spareConsumption.item': { uom: 'uom' },
  'caneGateEntry.vehicle': { driverName: 'driverName' },
  'caneWeighment.gateEntry': { grossWeightMt: 'grossWeightMt', tareWeightMt: 'tareWeightMt' },
  'canePayment.contract': { averageRatePerMt: 'ratePerMt' },
  'dispatch.vehicle': { driverName: 'driverName' },
  'dispatch.salesOrder': { grade: 'grade' },
  'salesInvoice.salesOrder': { grade: 'grade', rate: 'rate', quantityMt: 'quantityMt' },
  'salesInvoice.dispatch': { grade: 'grade', quantityMt: 'quantityMt' },
  'salesReturn.invoice': { grade: 'grade', rate: 'rate' },
};

function modelNameFor(key) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/** Inserts extension fields after their anchor field (or at the end). */
function applyExtensions(modules) {
  const byKey = new Map();
  for (const moduleDef of modules) for (const submodule of moduleDef.submodules) byKey.set(submodule.key, submodule);

  const byModelName = new Map([...byKey].map(([key, submodule]) => [modelNameFor(key), submodule]));

  for (const [key, additions] of Object.entries(EXTENSIONS)) {
    const submodule = byKey.get(key);
    if (!submodule) throw new Error(`relations: unknown submodule "${key}"`);
    for (const { after, ...declared } of additions) {
      const target = byModelName.get(declared.ref);
      if (!target) throw new Error(`relations: ${key}.${declared.name} references unknown model ${declared.ref}`);
      const field = { ...declared, refLabel: target.labelField };
      if (submodule.fields.some((existing) => existing.name === field.name)) continue; // already declared
      const at = submodule.fields.findIndex((existing) => existing.name === after);
      submodule.fields.splice(at === -1 ? submodule.fields.length : at + 1, 0, field);
    }
  }
}

/**
 * Computes `submodule.relations` for every submodule and validates the explicit
 * SCALAR_FILL table against the registry, so a renamed field fails fast at
 * startup instead of silently breaking a form.
 */
function deriveRelations(modules) {
  const byModel = new Map();
  const byKey = new Map();
  for (const moduleDef of modules) {
    for (const submodule of moduleDef.submodules) {
      byModel.set(modelNameFor(submodule.key), { moduleDef, submodule });
      byKey.set(submodule.key, submodule);
    }
  }

  // Which fields of a submodule other submodules read when a record is picked.
  const exposed = new Map();
  const expose = (key, name) => {
    if (!exposed.has(key)) exposed.set(key, new Set());
    exposed.get(key).add(name);
  };

  for (const moduleDef of modules) {
    for (const submodule of moduleDef.submodules) {
      const refs = submodule.fields.filter((field) => field.type === 'ref');
      const relations = { filterBy: {}, autofill: {}, identity: {} };

      for (const field of refs) {
        const target = byModel.get(field.ref);
        if (!target) throw new Error(`relations: ${submodule.key}.${field.name} references unknown model ${field.ref}`);
        const targetFields = new Map(target.submodule.fields.map((item) => [item.name, item]));

        const sameRef = (other) => {
          const counterpart = targetFields.get(other.name);
          return counterpart && counterpart.type === 'ref' && counterpart.ref === other.ref;
        };

        const parents = refs.filter((other) => other.name !== field.name && IDENTITY.has(other.name) && sameRef(other));
        if (parents.length) {
          relations.filterBy[field.name] = parents.map((parent) => parent.name);
          relations.identity[field.name] = parents.map((parent) => parent.name);
        }

        const fill = {};
        for (const other of refs) {
          if (other.name !== field.name && sameRef(other)) {
            fill[other.name] = other.name;
            expose(target.submodule.key, other.name);
          }
        }
        const scalars = SCALAR_FILL[`${submodule.key}.${field.name}`] || {};
        for (const [childField, sourceField] of Object.entries(scalars)) {
          if (!submodule.fields.some((item) => item.name === childField)) {
            throw new Error(`relations: ${submodule.key} has no field "${childField}"`);
          }
          if (!targetFields.has(sourceField)) {
            throw new Error(`relations: ${target.submodule.key} has no field "${sourceField}"`);
          }
          fill[childField] = sourceField;
          expose(target.submodule.key, sourceField);
        }
        if (Object.keys(fill).length) relations.autofill[field.name] = fill;
      }

      submodule.relations = relations;
    }
  }

  for (const key of Object.keys(SCALAR_FILL)) {
    const [subKey, fieldName] = key.split('.');
    if (!byKey.get(subKey)?.fields.some((field) => field.name === fieldName && field.type === 'ref')) {
      throw new Error(`relations: SCALAR_FILL entry "${key}" is not a reference field`);
    }
  }

  for (const [key, names] of exposed) byKey.get(key).exposedFields = [...names];
  for (const submodule of byKey.values()) submodule.exposedFields ||= [];
}

export { IDENTITY, EXTENSIONS, SCALAR_FILL, applyExtensions, deriveRelations, modelNameFor };