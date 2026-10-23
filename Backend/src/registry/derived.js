/**
 * Derived (computed) fields.
 *
 * Many registry fields are declared `readOnly` because they are calculated -
 * PO totals, GRN value, stock value and so on - but until now they were neither
 * stored nor calculated, while reports and the dashboard sum them. This file
 * defines the arithmetic once. The controller computes these on every write,
 * persists them (`persist: true`) so aggregations see real numbers, and falls
 * back to computing on read for records saved before this change.
 *
 * Only formulas that are unambiguous from the field names are included. Tax
 * splits on sales invoices (CGST/SGST/IGST depend on state-of-supply rules) and
 * payroll components (depend on attendance and pay-cycle policy) are NOT
 * guessed here.
 */

const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const money = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
const qty = (value) => Math.round((value + Number.EPSILON) * 1000) / 1000;

/** Quantity x rate, less discount, plus tax (and freight, where present). */
function priced(d, { quantityField = 'quantity', freight = true } = {}) {
  const base = num(d[quantityField]) * num(d.rate);
  const subTotal = money(base * (1 - num(d.discountPercent) / 100));
  const taxAmount = money((subTotal * num(d.taxPercent)) / 100);
  const totalAmount = money(subTotal + taxAmount + (freight ? num(d.freightAmount) : 0));
  return { subTotal, taxAmount, totalAmount };
}

const acceptedQty = (d) =>
  d.acceptedQty !== undefined && d.acceptedQty !== null && d.acceptedQty !== ''
    ? num(d.acceptedQty)
    : Math.max(0, num(d.receivedQty) - num(d.rejectedQty));

/** Pure formulas: (record values) -> derived field values. */
const DERIVE = {
  canePayment: (d) => {
    const grossAmount = money(num(d.totalQtyMt) * num(d.averageRatePerMt));
    return { grossAmount, netAmount: money(grossAmount - num(d.deductionAmount)) };
  },
  sugarBagging: (d) => ({ totalQtyMt: qty((num(d.bagsCount) * num(d.bagWeightKg)) / 1000) }),
  purchaseRequisition: (d) => ({ estimatedAmount: money(num(d.quantity) * num(d.estimatedRate)) }),
  quotation: (d) => ({ totalAmount: priced(d).totalAmount }),
  purchaseOrder: (d) => priced(d),
  salesOrder: (d) => priced(d, { quantityField: 'quantityMt', freight: false }),
  goodsReceipt: (d) => ({ totalAmount: money(acceptedQty(d) * num(d.rate)) }),
  purchaseReturn: (d) => ({ totalAmount: money(num(d.quantity) * num(d.rate)) }),
  materialIssue: (d) => ({ totalValue: money(num(d.quantity) * num(d.rate)) }),
  stockTransfer: (d) => ({ totalValue: money(num(d.quantity) * num(d.rate)) }),
  spareConsumption: (d) => ({ totalValue: money(num(d.quantity) * num(d.rate)) }),
  stockAdjustment: (d) => ({ value: money(num(d.quantity) * num(d.rate)) }),
  // Signed so that summing `value` per item/warehouse yields stock value.
  stockLedger: (d) => ({ value: money((num(d.inQty) - num(d.outQty)) * num(d.rate)) }),
};

/**
 * Snapshot fields that need one lookup, resolved at write time so history does
 * not change when the source later does (GRN keeps the quantity that was
 * ordered when it was received).
 */
const SNAPSHOT = {
  goodsReceipt: async (d, lookup) => {
    if (!d.purchaseOrder) return {};
    const order = await lookup('PurchaseOrder', d.purchaseOrder, 'quantity');
    return order ? { orderedQty: num(order.quantity) } : {};
  },
};

function deriveValues(submoduleKey, values) {
  const formula = DERIVE[submoduleKey];
  return formula ? formula(values) : {};
}

async function snapshotValues(submoduleKey, values, lookup) {
  const snapshot = SNAPSHOT[submoduleKey];
  return snapshot ? snapshot(values, lookup) : {};
}

/** Marks every derived field `persist: true` so the model stores it. */
function applyDerived(modules) {
  const byKey = new Map();
  for (const moduleDef of modules) for (const submodule of moduleDef.submodules) byKey.set(submodule.key, submodule);

  const required = { ...Object.fromEntries(Object.keys(DERIVE).map((key) => [key, null])), ...Object.fromEntries(Object.keys(SNAPSHOT).map((key) => [key, null])) };
  for (const key of Object.keys(required)) {
    const submodule = byKey.get(key);
    if (!submodule) throw new Error(`derived: unknown submodule "${key}"`);
    const names = new Set([
      ...Object.keys(DERIVE[key]?.({}) || {}),
      ...(key === 'goodsReceipt' ? ['orderedQty'] : []),
    ]);
    submodule.fields = submodule.fields.map((field) => {
      if (!names.has(field.name)) return field;
      if (!field.readOnly) throw new Error(`derived: ${key}.${field.name} should be a readOnly field`);
      return { ...field, persist: true };
    });
    for (const name of names) {
      if (!submodule.fields.some((field) => field.name === name)) throw new Error(`derived: ${key} has no field "${name}"`);
    }
  }
}

export { DERIVE, deriveValues, snapshotValues, applyDerived, acceptedQty };