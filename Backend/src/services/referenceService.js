/**
 * Referential integrity for registry resources.
 *
 * MongoDB has no foreign keys, and the generic payload validator only checks
 * that a reference *looks* like an id. This service closes that gap:
 *
 *  - validateReferences: every reference being set must point at a record that
 *    exists and is not inactive; identity parents must agree (a GRN's supplier
 *    must be its purchase order's supplier).
 *  - findDependents: lists the records that still point at a record, so deletes
 *    can be refused instead of leaving orphans.
 *
 * References that did not change on an update are left alone, so records saved
 * before this check existed can still be edited.
 */
import mongoose from 'mongoose';
import { modules } from '../registry/index.js';

let submoduleByModel = null;
function submoduleFor(modelName) {
  if (!submoduleByModel) {
    submoduleByModel = new Map();
    for (const moduleDef of modules) {
      for (const submodule of moduleDef.submodules) {
        submoduleByModel.set(submodule.key.charAt(0).toUpperCase() + submodule.key.slice(1), submodule);
      }
    }
  }
  return submoduleByModel.get(modelName);
}

const idOf = (value) => (value === null || value === undefined || value === '' ? null : String(value._id || value));

function refFieldsOf(submodule) {
  return submodule.fields.filter((field) => field.type === 'ref' || field.type === 'refs');
}

/** Ids an incoming value sets for a field (always an array of strings). */
function idsOf(field, value) {
  if (value === null || value === undefined || value === '') return [];
  return (field.type === 'refs' ? (Array.isArray(value) ? value : []) : [value]).map(idOf).filter(Boolean);
}

/**
 * Returns a list of human-readable problems (empty when the references are
 * valid). `existing` is the stored record on update, `value` the validated
 * incoming values.
 */
async function validateReferences({ submodule, value, existing = null, getModel = (name) => mongoose.models[name] }) {
  const errors = [];
  const relations = submodule.relations || { identity: {} };
  const fields = refFieldsOf(submodule);

  // Only references that are new or changed need to be checked.
  const checks = [];
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(value, field.name)) continue;
    const incoming = idsOf(field, value[field.name]);
    const previous = existing ? idsOf(field, existing[field.name]) : [];
    const changed = incoming.filter((id) => !previous.includes(id));
    if (changed.length) checks.push({ field, ids: changed });
  }

  // Identity parents are compared on the merged record, so a change to either
  // side is validated against the other.
  const merged = (name) => (Object.prototype.hasOwnProperty.call(value, name) ? idOf(value[name]) : idOf(existing?.[name]));
  const identityTargets = [];
  for (const [childField, parentNames] of Object.entries(relations.identity || {})) {
    const field = fields.find((item) => item.name === childField);
    const picked = merged(childField);
    if (!field || !picked) continue;
    const touched = [childField, ...parentNames].some((name) => Object.prototype.hasOwnProperty.call(value, name));
    if (touched) identityTargets.push({ field, picked, parentNames });
  }

  // 1. Existence / status.
  const found = new Map(); // `${model}:${id}` -> doc
  const need = new Map(); // model -> Set(ids)
  for (const { field, ids } of checks) {
    if (!need.has(field.ref)) need.set(field.ref, new Set());
    ids.forEach((id) => need.get(field.ref).add(id));
  }
  for (const { field, picked, parentNames } of identityTargets) {
    if (!need.has(field.ref)) need.set(field.ref, new Set());
    need.get(field.ref).add(picked);
  }

  for (const [modelName, ids] of need) {
    const Model = getModel(modelName);
    if (!Model) continue;
    const identityNames = new Set(identityTargets.filter((target) => target.field.ref === modelName).flatMap((target) => target.parentNames));
    const select = ['status', ...identityNames].join(' ');
    const valid = [...ids].filter((id) => mongoose.isValidObjectId(id));
    const docs = valid.length ? await Model.find({ _id: { $in: valid } }).select(select).lean() : [];
    for (const doc of docs) found.set(`${modelName}:${doc._id}`, doc);
  }

  for (const { field, ids } of checks) {
    for (const id of ids) {
      const doc = found.get(`${field.ref}:${id}`);
      if (!doc) errors.push(`${field.label} refers to a record that does not exist`);
      else if (doc.status === 'inactive') errors.push(`${field.label} is inactive and cannot be selected`);
    }
  }

  // 2. Identity consistency.
  for (const { field, picked, parentNames } of identityTargets) {
    const doc = found.get(`${field.ref}:${picked}`);
    if (!doc) continue; // missing records are reported above (or unchanged legacy data)
    for (const parentName of parentNames) {
      const mine = merged(parentName);
      const theirs = idOf(doc[parentName]);
      if (mine && theirs && mine !== theirs) {
        const parentLabel = submodule.fields.find((item) => item.name === parentName)?.label || parentName;
        errors.push(`${parentLabel} does not match the selected ${field.label}`);
      }
    }
  }

  return [...new Set(errors)];
}

/* --------------------------------------------------------- delete guard --- */

let dependencyIndex = null;

/** model name -> [{ modelName, path }] for every ObjectId reference in loaded models. */
function buildDependencyIndex() {
  const index = new Map();
  const IGNORED_MODELS = new Set(['ActivityLog', 'RefreshToken', 'Counter']);
  const IGNORED_PATHS = new Set(['createdBy', 'updatedBy']); // audit stamps never block a delete

  for (const [modelName, Model] of Object.entries(mongoose.models)) {
    if (IGNORED_MODELS.has(modelName)) continue;
    Model.schema.eachPath((path, type) => {
      if (IGNORED_PATHS.has(path)) return;
      const target = type.options?.ref || type.caster?.options?.ref;
      const isId = type.instance === 'ObjectId' || (type.instance === 'Array' && type.caster?.instance === 'ObjectId');
      if (!isId || typeof target !== 'string') return;
      if (!index.has(target)) index.set(target, []);
      index.get(target).push({ modelName, path });
    });
  }
  return index;
}

/** Records that still reference `id`: [{ model, name, count }]. */
async function findDependents(modelName, id) {
  if (!dependencyIndex) dependencyIndex = buildDependencyIndex();
  const users = dependencyIndex.get(modelName) || [];
  const counts = await Promise.all(
    users.map(async ({ modelName: userModel, path }) => ({
      model: userModel,
      name: submoduleFor(userModel)?.name || userModel,
      count: await mongoose.models[userModel].countDocuments({ [path]: id }),
    })),
  );
  const merged = new Map();
  for (const entry of counts) {
    if (!entry.count) continue;
    const current = merged.get(entry.model);
    merged.set(entry.model, { ...entry, count: (current?.count || 0) + entry.count });
  }
  return [...merged.values()];
}

/** Rebuilds the dependency index (tests / hot reload). */
function resetDependencyIndex() {
  dependencyIndex = null;
}

export { validateReferences, findDependents, resetDependencyIndex, refFieldsOf };