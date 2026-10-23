/**
 * Stock posting: keeps the Stock Ledger - the single source of truth behind the
 * inventory report, stock value and low-stock alerts - in step with the
 * documents that move stock.
 *
 * A document moves stock only once it reaches status `posted`:
 *
 *   Goods Receipt     -> Receipt  (+ accepted quantity)
 *   Purchase Return   -> Issue    (- quantity, from the GRN's warehouse)
 *   Material Issue    -> Issue    (- quantity)
 *   Stock Transfer    -> Transfer Out (from) + Transfer In (to)
 *   Stock Adjustment  -> Adjustment (+/- per type)
 *   Sugar Bagging     -> Production (+ total MT)        when a product is linked
 *   By-Product        -> Production (+ quantity MT)     when a product is linked
 *   Spare Consumption -> Issue    (- quantity)          immediately (no status)
 *
 * Posting is idempotent: ledger rows carry `sourceModel` / `sourceId`, and every
 * sync deletes the document's previous rows and rewrites them from its current
 * state. Editing a posted document, un-posting it or deleting it therefore
 * always leaves the ledger correct, and rows are never double counted.
 */
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import { getSubmodule } from '../registry/index.js';
import { acceptedQty, deriveValues } from '../registry/derived.js';
import { generateNumber } from './numberingService.js';

const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const isPosted = (doc) => doc.status === 'posted';

const POSTERS = {
  goodsReceipt: {
    active: isPosted,
    lines: (d) => [
      { item: d.item, warehouse: d.warehouse, transactionType: 'Receipt', inQty: acceptedQty(d), rate: d.rate, referenceNo: d.grnNo, entryDate: d.grnDate },
    ],
  },
  purchaseReturn: {
    active: isPosted,
    lines: async (d, lookup) => {
      const receipt = d.goodsReceipt ? await lookup('GoodsReceipt', d.goodsReceipt, 'warehouse') : null;
      return [
        { item: d.item, warehouse: receipt?.warehouse, transactionType: 'Issue', outQty: num(d.quantity), rate: d.rate, referenceNo: d.returnNo, entryDate: d.returnDate },
      ];
    },
    needs: 'a goods receipt that has a warehouse',
  },
  materialIssue: {
    active: isPosted,
    lines: (d) => [
      { item: d.item, warehouse: d.warehouse, transactionType: 'Issue', outQty: num(d.quantity), rate: d.rate, referenceNo: d.issueNo, entryDate: d.issueDate },
    ],
  },
  stockTransfer: {
    active: isPosted,
    lines: (d) => [
      { item: d.item, warehouse: d.fromWarehouse, transactionType: 'Transfer Out', outQty: num(d.quantity), rate: d.rate, referenceNo: d.transferNo, entryDate: d.transferDate },
      { item: d.item, warehouse: d.toWarehouse, transactionType: 'Transfer In', inQty: num(d.quantity), rate: d.rate, referenceNo: d.transferNo, entryDate: d.transferDate },
    ],
  },
  stockAdjustment: {
    active: isPosted,
    lines: (d) => [
      {
        item: d.item,
        warehouse: d.warehouse,
        transactionType: 'Adjustment',
        inQty: d.adjustmentType === 'Decrease' ? 0 : num(d.quantity),
        outQty: d.adjustmentType === 'Decrease' ? num(d.quantity) : 0,
        rate: d.rate,
        referenceNo: d.adjustmentNo,
        entryDate: d.adjustmentDate,
      },
    ],
  },
  sugarBagging: {
    active: (d) => isPosted(d) && Boolean(d.item),
    lines: (d) => [
      { item: d.item, warehouse: d.warehouse, transactionType: 'Production', inQty: deriveValues('sugarBagging', d).totalQtyMt, rate: 0, referenceNo: d.baggingNo, entryDate: d.baggingDate },
    ],
  },
  byProduct: {
    active: (d) => isPosted(d) && Boolean(d.item),
    lines: (d) => [
      { item: d.item, warehouse: d.warehouse, transactionType: 'Production', inQty: num(d.quantityMt), rate: 0, referenceNo: d.entryNo, entryDate: d.entryDate },
    ],
  },
  spareConsumption: {
    // No status on this document: it posts as soon as an item and store are given.
    active: (d) => Boolean(d.item && d.issuedFrom),
    lines: (d) => [
      { item: d.item, warehouse: d.issuedFrom, transactionType: 'Issue', outQty: num(d.quantity), rate: d.rate, referenceNo: d.entryNo, entryDate: d.entryDate },
    ],
  },
};

const modelNameFor = (key) => key.charAt(0).toUpperCase() + key.slice(1);
const hasPoster = (submoduleKey) => Boolean(POSTERS[submoduleKey]);

async function lookup(modelName, id, select) {
  const Model = mongoose.models[modelName];
  return Model ? Model.findById(id).select(select).lean() : null;
}

/** On-hand quantity of an item in a warehouse, per the ledger. */
async function stockBalance(Ledger, item, warehouse, opts) {
  const [row] = await Ledger.aggregate([
    { $match: { item: new mongoose.Types.ObjectId(String(item)), warehouse: new mongoose.Types.ObjectId(String(warehouse)) } },
    { $group: { _id: null, inQty: { $sum: '$inQty' }, outQty: { $sum: '$outQty' } } },
  ]).session(opts.session || null);
  return num(row?.inQty) - num(row?.outQty);
}

const pairKey = (row) => `${String(row.item)}:${String(row.warehouse)}`;

function netByPair(rows) {
  const net = new Map();
  for (const row of rows) net.set(pairKey(row), (net.get(pairKey(row)) || 0) + num(row.inQty) - num(row.outQty));
  return net;
}

/**
 * Rewrites the ledger rows for one source document from its current state.
 * Pass `doc = null` to remove them (the document was deleted).
 *
 * After rewriting, every item/warehouse whose net movement went DOWN (a bigger
 * issue, a smaller receipt, a reversed receipt) must still have a non-negative
 * balance, otherwise the whole change is refused. Set ALLOW_NEGATIVE_STOCK=true
 * to disable this check.
 */
async function syncPostings({ submoduleKey, id, doc, session = null, allowNegative = process.env.ALLOW_NEGATIVE_STOCK === 'true' }) {
  const poster = POSTERS[submoduleKey];
  if (!poster) return { posted: 0 };

  const Ledger = mongoose.models.StockLedger;
  if (!Ledger) return { posted: 0 };
  const opts = session ? { session } : {};
  const source = { sourceModel: modelNameFor(submoduleKey), sourceId: id };

  const previous = await Ledger.find(source).select('item warehouse inQty outQty').lean().session(session);
  await Ledger.deleteMany(source, opts);

  const rows = [];
  if (doc && poster.active(doc)) {
    const lines = (await poster.lines(doc, lookup)).filter((line) => num(line.inQty) > 0 || num(line.outQty) > 0);
    for (const line of lines) {
      if (!line.item || !line.warehouse) {
        throw ApiError.badRequest(
          poster.needs ? `Cannot post to stock: select ${poster.needs}` : 'Cannot post to stock: an item and a warehouse are required',
        );
      }
    }

    const ledgerSubmodule = getSubmodule('stockLedger').submodule;
    for (const line of lines) {
      const entryDate = line.entryDate ? new Date(line.entryDate) : new Date();
      const row = {
        entryNo: await generateNumber({ submodule: ledgerSubmodule, date: entryDate }),
        entryDate,
        item: line.item,
        warehouse: line.warehouse,
        transactionType: line.transactionType,
        referenceNo: line.referenceNo,
        inQty: num(line.inQty),
        outQty: num(line.outQty),
        rate: num(line.rate),
        ...source,
      };
      Object.assign(row, deriveValues('stockLedger', row));
      rows.push(row);
    }
    if (rows.length) await Ledger.create(rows, { ...opts, ordered: true });
  }

  if (!allowNegative) {
    const before = netByPair(previous);
    const after = netByPair(rows);
    for (const [key, oldNet] of before) {
      if ((after.get(key) || 0) >= oldNet - 1e-9) continue;
      const [item, warehouse] = key.split(':');
      const balance = await stockBalance(Ledger, item, warehouse, opts);
      if (balance < -1e-9) throw ApiError.badRequest(`Insufficient stock: this change would leave a balance of ${balance}`);
    }
    for (const [key, newNet] of after) {
      if (before.has(key) || newNet >= 0) continue;
      const [item, warehouse] = key.split(':');
      const balance = await stockBalance(Ledger, item, warehouse, opts);
      if (balance < -1e-9) throw ApiError.badRequest(`Insufficient stock: this change would leave a balance of ${balance}`);
    }
  }
  return { posted: rows.length };
}

/** Exact copy of a document's current ledger rows (used to undo a failed change). */
async function snapshotPostings(submoduleKey, id) {
  const Ledger = mongoose.models.StockLedger;
  if (!Ledger || !POSTERS[submoduleKey]) return [];
  return Ledger.find({ sourceModel: modelNameFor(submoduleKey), sourceId: id }).lean();
}

/** Puts a snapshot back exactly as it was (same ids and entry numbers). */
async function restorePostings(submoduleKey, id, rows) {
  const Ledger = mongoose.models.StockLedger;
  if (!Ledger || !POSTERS[submoduleKey]) return;
  await Ledger.deleteMany({ sourceModel: modelNameFor(submoduleKey), sourceId: id });
  if (rows.length) await Ledger.collection.insertMany(rows);
}

export { POSTERS, hasPoster, syncPostings, stockBalance, snapshotPostings, restorePostings };