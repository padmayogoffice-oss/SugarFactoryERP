/**
 * Aggregation helpers used by the dashboard and reports: counts, sums, grouped
 * sums and date-bucketed trends. All accept a match filter so callers can scope
 * a query to a season, a unit or a status.
 */
const mongoose = require('mongoose');

function model(name) {
  return mongoose.models[name];
}

/** Sums a numeric field, returning 0 when the collection is empty. */
async function sum(modelName, field, match = {}) {
  const Model = model(modelName);
  if (!Model) return 0;
  const [result] = await Model.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: `$${field}` } } },
  ]);
  return result?.total || 0;
}

async function count(modelName, match = {}) {
  const Model = model(modelName);
  if (!Model) return 0;
  return Model.countDocuments(match);
}

/**
 * Aggregates a numeric field grouped by another field, newest groups first.
 * When `ref` is supplied the grouped value is an ObjectId that gets resolved to
 * a human-readable label (e.g. a supplier's name) instead of leaking the raw id.
 */
async function groupSum(modelName, groupField, sumField, { match = {}, limit = 12, sort = -1, ref = null } = {}) {
  const Model = model(modelName);
  if (!Model) return [];

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: `$${groupField}`,
        value: { $sum: `$${sumField}` },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: sort } },
    { $limit: limit },
  ];

  if (ref?.collection && ref?.field) {
    pipeline.push(
      { $lookup: { from: ref.collection, localField: '_id', foreignField: '_id', as: 'refDoc' } },
      {
        $project: {
          _id: 0,
          label: { $ifNull: [{ $first: `$refDoc.${ref.field}` }, { $toString: '$_id' }] },
          value: 1,
          count: 1,
        },
      },
    );
  } else {
    pipeline.push({ $project: { _id: 0, label: '$_id', value: 1, count: 1 } });
  }

  return Model.aggregate(pipeline);
}

/** Daily totals for the trailing window, used by trend charts. */
async function dailyTrend(modelName, dateField, sumField, days = 14) {
  const Model = model(modelName);
  if (!Model) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return Model.aggregate([
    { $match: { [dateField]: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: `$${dateField}` } },
        value: { $sum: `$${sumField}` },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, label: '$_id', value: 1 } },
  ]);
}

/** Production snapshot for the current crushing season. */
async function productionSnapshot() {
  const ShiftProduction = model('ShiftProduction');
  if (!ShiftProduction) return { caneCrushedMt: 0, sugarProducedMt: 0, recoveryPercent: 0, avgRecoveryPercent: 0, entries: 0 };

  const [result] = await ShiftProduction.aggregate([
    {
      $group: {
        _id: null,
        caneCrushedMt: { $sum: '$caneCrushedMt' },
        sugarProducedMt: { $sum: '$sugarProducedMt' },
        molassesProducedMt: { $sum: '$molassesProducedMt' },
        bagasseProducedMt: { $sum: '$bagasseProducedMt' },
        powerGeneratedKwh: { $sum: '$powerGeneratedKwh' },
        avgRecovery: { $avg: '$recoveryPercent' },
        entries: { $sum: 1 },
      },
    },
  ]);

  if (!result) return { caneCrushedMt: 0, sugarProducedMt: 0, recoveryPercent: 0, avgRecoveryPercent: 0, entries: 0 };

  const recovery = result.caneCrushedMt ? (result.sugarProducedMt / result.caneCrushedMt) * 100 : 0;
  return {
    caneCrushedMt: result.caneCrushedMt || 0,
    sugarProducedMt: result.sugarProducedMt || 0,
    molassesProducedMt: result.molassesProducedMt || 0,
    bagasseProducedMt: result.bagasseProducedMt || 0,
    powerGeneratedKwh: result.powerGeneratedKwh || 0,
    avgRecoveryPercent: Number((result.avgRecovery || 0).toFixed(2)),
    recoveryPercent: Number(recovery.toFixed(2)),
    entries: result.entries || 0,
  };
}

/** Current stock on hand per item, derived from the stock ledger. */
async function stockOnHand(limit = 10) {
  const StockLedger = model('StockLedger');
  if (!StockLedger) return [];

  return StockLedger.aggregate([
    {
      $group: {
        _id: '$item',
        inQty: { $sum: '$inQty' },
        outQty: { $sum: '$outQty' },
      },
    },
    {
      $project: {
        _id: 0,
        item: '$_id',
        balanceQty: { $subtract: ['$inQty', '$outQty'] },
      },
    },
    { $match: { balanceQty: { $ne: 0 } } },
    { $sort: { balanceQty: -1 } },
    { $limit: limit },
    { $lookup: { from: 'items', localField: 'item', foreignField: '_id', as: 'itemDoc' } },
    { $project: { label: { $ifNull: [{ $first: '$itemDoc.name' }, 'Unknown item'] }, value: '$balanceQty' } },
  ]);
}

module.exports = { sum, count, groupSum, dailyTrend, productionSnapshot, stockOnHand, model };
