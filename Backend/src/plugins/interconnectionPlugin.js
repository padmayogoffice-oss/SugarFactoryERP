/**
 * Interconnection plugin: cross-module record behaviour for every registry entity.
 *
 * Registered once (see registry/index.js) so it applies to all entity models
 * without touching their individual schemas, controllers or routes. For a
 * registry entity it provides:
 *
 *  create   - generated business identifier, reference validation (records exist,
 *             not inactive, linked records agree), derived totals, stock posting
 *  update   - identifier preserved, changed references validated, derived totals
 *             recomputed, stock posting rewritten from the new state
 *  delete   - refused while other records still reference it; stock posting removed
 *
 * Failures after a record is written are compensated (the new record is removed,
 * or the previous record and ledger rows are restored) so nothing is left half
 * saved. Models that are not registry entities (users, roles, logs) are ignored.
 */
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import { modules } from '../registry/index.js';
import { deriveValues, snapshotValues } from '../registry/derived.js';
import { generateNumber, resyncCounter } from '../services/numberingService.js';
import { validateReferences, findDependents } from '../services/referenceService.js';
import { hasPoster, syncPostings, snapshotPostings, restorePostings } from '../services/postingService.js';

let checkReferences = true;

/**
 * Turns reference validation (records exist, not inactive, linked records agree)
 * on or off. Only the demo-data seeder switches it off: its generated records are
 * deliberately random and not meant to follow business rules. Numbering, derived
 * totals and delete protection are unaffected.
 */
function setReferenceValidation(enabled) {
  checkReferences = Boolean(enabled);
}

let byModel = null;
function entityFor(modelName) {
  if (!byModel) {
    byModel = new Map();
    for (const moduleDef of modules) {
      for (const submodule of moduleDef.submodules) {
        byModel.set(submodule.key.charAt(0).toUpperCase() + submodule.key.slice(1), submodule);
      }
    }
  }
  return byModel.get(modelName);
}

async function lookup(modelName, id, select) {
  const Model = mongoose.models[modelName];
  return Model ? Model.findById(id).select(select).lean() : null;
}

const dateFieldOf = (submodule) => submodule.fields.find((field) => field.type === 'date')?.name;

/** Next generated number that no existing record already uses (legacy numbers included). */
async function uniqueNumber(submodule, doc) {
  const Model = doc.constructor;
  const field = submodule.autoNumberField;
  const dateField = dateFieldOf(submodule);
  const date = (dateField && doc.get(dateField)) || new Date();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const value = await generateNumber({ submodule, date });
    if (!(await Model.exists({ [field]: value }))) return value;
    await resyncCounter({ submodule, model: Model, date });
  }
  throw ApiError.conflict(`Could not allocate a unique ${field}; please retry`);
}

/** Incoming values of an update, from either `{ field }` or `{ $set: { field } }`. */
function incomingOf(update) {
  const plain = Object.fromEntries(Object.entries(update || {}).filter(([key]) => !key.startsWith('$')));
  return { ...plain, ...(update?.$set || {}) };
}

function interconnectionPlugin(schema) {
  // Foreign keys are indexed: cascading dropdowns, joins and the delete guard all look records up by reference.
  const indexed = new Set(schema.indexes().map(([fields]) => Object.keys(fields).join(',')));
  schema.eachPath((path, type) => {
    if (path === 'createdBy' || path === 'updatedBy' || indexed.has(path)) return;
    const target = type.options?.ref || type.caster?.options?.ref;
    const isId = type.instance === 'ObjectId' || (type.instance === 'Array' && type.caster?.instance === 'ObjectId');
    if (isId && typeof target === 'string' && !type.options.index && !type.options.unique) schema.index({ [path]: 1 });
  });

  /* ------------------------------------------------------------ create --- */

  schema.pre('validate', async function interconnectCreate() {
    const submodule = entityFor(this.constructor.modelName);
    if (!submodule || !this.isNew) return;
    // Rows written by stock posting are already complete and trusted.
    if (submodule.key === 'stockLedger' && this.get('sourceModel')) return;

    if (submodule.autoNumberField && !this.get(submodule.autoNumberField)) {
      this.set(submodule.autoNumberField, await uniqueNumber(submodule, this));
    }

    const values = this.toObject({ virtuals: false });
    if (checkReferences) {
      const problems = await validateReferences({ submodule, value: values, existing: null });
      if (problems.length) throw ApiError.badRequest('Validation failed', problems);
    }

    this.set(deriveValues(submodule.key, values));
    this.set(await snapshotValues(submodule.key, values, lookup));
  });

  schema.pre('save', function rememberNew() {
    this.$locals.interconnectionCreated = this.isNew;
  });

  schema.post('save', async function postOnSave(doc) {
    const submodule = entityFor(doc.constructor.modelName);
    if (!submodule || !hasPoster(submodule.key)) return;
    try {
      await syncPostings({ submoduleKey: submodule.key, id: doc._id, doc: doc.toObject({ virtuals: false }) });
    } catch (error) {
      if (doc.$locals.interconnectionCreated) {
        // The document was just created: remove it so a refused posting leaves nothing behind.
        await syncPostings({ submoduleKey: submodule.key, id: doc._id, doc: null, allowNegative: true }).catch(() => {});
        await doc.constructor.deleteOne({ _id: doc._id }).catch(() => {});
      }
      throw error;
    }
  });

  /* ------------------------------------------------------------ update --- */

  schema.pre('findOneAndUpdate', async function interconnectUpdate() {
    const submodule = entityFor(this.model.modelName);
    if (!submodule) return;
    const existing = await this.model.findOne(this.getFilter()).lean();
    if (!existing) return; // the controller reports "not found"

    if (submodule.key === 'stockLedger' && existing.sourceModel) {
      throw ApiError.conflict('This entry was posted automatically from its source document. Change the document instead.');
    }

    const update = this.getUpdate() || {};
    if (submodule.autoNumberField) {
      // A record keeps its identifier for life.
      delete update[submodule.autoNumberField];
      if (update.$set) delete update.$set[submodule.autoNumberField];
    }

    const incoming = incomingOf(update);
    const problems = await validateReferences({ submodule, value: incoming, existing });
    if (problems.length) throw ApiError.badRequest('Validation failed', problems);

    const merged = { ...existing, ...incoming };
    const derived = deriveValues(submodule.key, merged);
    if (Object.prototype.hasOwnProperty.call(incoming, 'purchaseOrder') || existing.orderedQty === undefined) {
      Object.assign(derived, await snapshotValues(submodule.key, merged, lookup));
    }
    if (Object.keys(derived).length) this.set(derived);

    this.interconnection = {
      existing,
      snapshot: hasPoster(submodule.key) ? await snapshotPostings(submodule.key, existing._id) : [],
    };
  });

  schema.post('findOneAndUpdate', async function postOnUpdate(doc) {
    const submodule = entityFor(this.model.modelName);
    if (!submodule || !doc || !this.interconnection || !hasPoster(submodule.key)) return;
    const { existing, snapshot } = this.interconnection;
    try {
      await syncPostings({ submoduleKey: submodule.key, id: doc._id, doc: doc.toObject({ virtuals: false }) });
    } catch (error) {
      // Put the record and its ledger rows back exactly as they were.
      await this.model.replaceOne({ _id: existing._id }, existing).catch(() => {});
      await restorePostings(submodule.key, existing._id, snapshot).catch(() => {});
      throw error;
    }
  });

  /* ------------------------------------------------------------ delete --- */

  schema.pre('findOneAndDelete', async function interconnectDelete() {
    const submodule = entityFor(this.model.modelName);
    if (!submodule) return;
    const existing = await this.model.findOne(this.getFilter()).lean();
    if (!existing) return;

    if (submodule.key === 'stockLedger' && existing.sourceModel) {
      throw ApiError.conflict('This entry was posted automatically from its source document. Change the document instead.');
    }

    // Refuse to orphan records that still point here.
    const dependents = await findDependents(this.model.modelName, existing._id);
    if (dependents.length) {
      const summary = dependents.map((entry) => `${entry.count} ${entry.name}`).join(', ');
      throw ApiError.conflict(`Cannot delete this ${submodule.name} because it is used by: ${summary}`);
    }

    if (hasPoster(submodule.key)) {
      const snapshot = await snapshotPostings(submodule.key, existing._id);
      try {
        await syncPostings({ submoduleKey: submodule.key, id: existing._id, doc: null });
      } catch (error) {
        await restorePostings(submodule.key, existing._id, snapshot).catch(() => {});
        throw error;
      }
    }
  });
}

export { interconnectionPlugin, setReferenceValidation };