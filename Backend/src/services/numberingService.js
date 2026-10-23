/**
 * Business identifier generation.
 *
 * - Numbers come from an atomic `$inc` on a Counter document, so concurrent
 *   creates never receive the same sequence value.
 * - Identifiers are assigned once, at creation. Updates never touch them.
 * - Format: PREFIX-FY-NNNNN for transactions (FY = Indian financial year, e.g.
 *   2627 for Apr-2026..Mar-2027) and PREFIX-NNNNN for master records. A
 *   Document Numbering rule whose code equals the submodule key overrides
 *   prefix, suffix, padding and the year switch.
 * - Records created before this feature may already use a number the counter
 *   has not reached yet; `resyncCounter` lifts the counter above the highest
 *   existing number so a collision is only ever hit once.
 */
import mongoose from 'mongoose';
import Counter from '../models/Counter.js';

const DEFAULT_PADDING = 5;

/** Indian financial year label (April to March): 2026-07-01 -> "2627". */
function financialYearLabel(date = new Date()) {
  const when = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const startYear = when.getMonth() >= 3 ? when.getFullYear() : when.getFullYear() - 1;
  return `${String(startYear).slice(-2)}${String(startYear + 1).slice(-2)}`;
}

function formatNumber({ prefix, suffix = '', padding = DEFAULT_PADDING, fy = null, seq }) {
  const parts = [prefix];
  if (fy) parts.push(fy);
  parts.push(String(seq).padStart(Math.max(1, Number(padding) || DEFAULT_PADDING), '0'));
  return parts.join('-') + (suffix ? `-${suffix}` : '');
}

/** Looks up an admin-configured rule for this submodule; falls back to defaults. */
async function resolveRule(submodule, field) {
  const defaults = { prefix: field.autoNumber.prefix, suffix: '', padding: DEFAULT_PADDING, includeYear: field.autoNumber.year };
  const RuleModel = mongoose.models.DocumentNumbering;
  if (!RuleModel) return defaults;
  try {
    const rule = await RuleModel.findOne({ code: submodule.key, status: { $ne: 'inactive' } }).lean();
    if (!rule) return defaults;
    return {
      prefix: rule.prefix || defaults.prefix,
      suffix: rule.suffix || '',
      padding: rule.padding || DEFAULT_PADDING,
      includeYear: rule.includeYear ?? defaults.includeYear,
    };
  } catch {
    return defaults;
  }
}

function counterKey(submodule, rule, fy) {
  return `${submodule.key}:${rule.includeYear ? fy : 'all'}`;
}

/** Atomically allocates the next sequence value and returns the formatted number. */
async function generateNumber({ submodule, date = new Date() }) {
  const field = submodule.fields.find((item) => item.name === submodule.autoNumberField);
  if (!field?.autoNumber) throw new Error(`${submodule.key} has no generated identifier`);

  const rule = await resolveRule(submodule, field);
  const fy = rule.includeYear ? financialYearLabel(date) : null;
  const counter = await Counter.findOneAndUpdate(
    { _id: counterKey(submodule, rule, fy || 'all') },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return formatNumber({ prefix: rule.prefix, suffix: rule.suffix, padding: rule.padding, fy, seq: counter.seq });
}

/**
 * Raises the counter to at least the highest trailing number already used by
 * existing records, so generation continues after legacy / hand-typed numbers.
 */
async function resyncCounter({ submodule, model, date = new Date() }) {
  const field = submodule.fields.find((item) => item.name === submodule.autoNumberField);
  const rule = await resolveRule(submodule, field);
  const fy = rule.includeYear ? financialYearLabel(date) : null;
  const [top] = await model.aggregate([
    { $match: { [field.name]: { $type: 'string' } } },
    { $project: { match: { $regexFind: { input: `$${field.name}`, regex: '(\\d+)(?:-[^-]*)?$' } } } },
    { $match: { match: { $ne: null } } },
    { $project: { n: { $convert: { input: { $arrayElemAt: ['$match.captures', 0] }, to: 'long', onError: 0, onNull: 0 } } } },
    { $group: { _id: null, max: { $max: '$n' } } },
  ]);
  const max = Number(top?.max || 0);
  if (max > 0) {
    await Counter.updateOne({ _id: counterKey(submodule, rule, fy || 'all') }, { $max: { seq: max } }, { upsert: true });
  }
  return max;
}

/** True when a Mongo duplicate-key error was raised on the generated field. */
function isNumberCollision(error, submodule) {
  if (!error || error.code !== 11000) return false;
  const keys = Object.keys(error.keyPattern || error.keyValue || {});
  return keys.includes(submodule.autoNumberField);
}

export { financialYearLabel, formatNumber, generateNumber, resyncCounter, isNumberCollision };