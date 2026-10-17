/**
 * Generic CRUD controller for a registry submodule. Search, filter, pagination,
 * reference population and unique-field handling all come from the submodule's
 * registry metadata, so one implementation serves every resource.
 */
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { validatePayload } = require('../registry/fields');
const { ok, created, paginated, buildListQuery, escapeRegex } = require('../utils/apiResponse');

const COMPUTED = {
  sugarFromCane: (doc) => {
    const cane = Number(doc.caneCrushedMt || 0);
    const sugar = Number(doc.sugarProducedMt || 0);
    if (!cane) return 0;
    return Number(((sugar / cane) * 100).toFixed(3));
  },
  plannedSugar: (doc) => {
    const cane = Number(doc.plannedCrushingMt || 0);
    const recovery = Number(doc.plannedRecoveryPercent || 0);
    return Number(((cane * recovery) / 100).toFixed(3));
  },
  netWeight: (doc) => {
    const gross = Number(doc.grossWeightMt || 0);
    const tare = Number(doc.tareWeightMt || 0);
    if (!gross && !tare) return 0;
    return Number((gross - tare).toFixed(3));
  },
  purity: (doc) => {
    const pol = Number(doc.polPercent || 0);
    const brix = Number(doc.brixPercent || 0);
    if (!brix) return 0;
    return Number(((pol / brix) * 100).toFixed(3));
  },
  caneRecovery: (doc) => {
    const pol = Number(doc.polPercent || 0);
    const brix = Number(doc.brixPercent || 0);
    const fibre = Number(doc.fibrePercent || 12);
    if (!brix) return 0;
    const purity = (pol / brix) * 100;
    return Number((purity * (1 - fibre / 100)).toFixed(3));
  },
  powerConsumed: (doc) =>
    Number((Number(doc.generatedKwh || 0) - Number(doc.exportedKwh || 0)).toFixed(3)),
};

/** Derived fields are never persisted; they are recomputed on read. */
const FIELD_COMPUTATIONS = {
  recoveryPercent: COMPUTED.sugarFromCane,
  plannedSugarMt: COMPUTED.plannedSugar,
  netWeightMt: COMPUTED.netWeight,
  purityPercent: COMPUTED.purity,
  consumedKwh: COMPUTED.powerConsumed,
};

function applyComputed(input) {
  const plain = typeof input.toObject === 'function' ? input.toObject({ virtuals: true }) : { ...input };
  for (const [field, computation] of Object.entries(FIELD_COMPUTATIONS)) {
    plain[field] = computation(plain);
  }
  return plain;
}

function escapeRegexLocal(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds a standard CRUD controller for a registry submodule. Every submodule
 * gets identical, permission-checked REST semantics from one implementation.
 */
function createResourceController({ model, submodule }) {
  const { searchable, filterable, defaultSort, labelField } = submodule;
  const refFields = submodule.fields.filter((field) => field.type === 'ref' || field.type === 'refs');
  const computedFields = submodule.fields
    .filter((field) => FIELD_COMPUTATIONS[field.name])
    .map((field) => field.name);

  function populateQuery(query) {
    for (const field of refFields) {
      query.populate({ path: field.name, select: 'name code label ' + (field.refLabel || 'name') });
    }
    return query;
  }

  const list = asyncHandler(async (req, res) => {
    const { page, limit, skip, filter, sort } = buildListQuery(req, {
      searchableFields: searchable,
      filterableFields: filterable,
      defaultSort,
    });

    const [items, total] = await Promise.all([
      populateQuery(model.find(filter).sort(sort).skip(skip).limit(limit)).lean(),
      model.countDocuments(filter),
    ]);

    return paginated(res, items.map(applyComputed), { page, limit, total });
  });

  const getOne = asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest('Invalid identifier');
    const doc = await populateQuery(model.findById(req.params.id));
    if (!doc) throw ApiError.notFound(`${submodule.name} not found`);
    return ok(res, applyComputed(doc));
  });

  const create = asyncHandler(async (req, res) => {
    const { errors, value } = validatePayload(submodule.fields, req.body);
    if (errors.length) throw ApiError.badRequest('Validation failed', errors);

    value.createdBy = req.user?._id;
    const doc = await model.create(value);

    res.locals.resourceId = doc._id;
    res.locals.resourceLabel = String(doc[labelField] || '');
    res.locals.auditDescription = `Created ${submodule.name}`;

    const populated = await populateQuery(model.findById(doc._id));
    return created(res, applyComputed(populated));
  });

  const update = asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest('Invalid identifier');
    const { errors, value } = validatePayload(submodule.fields, req.body, { partial: true });
    if (errors.length) throw ApiError.badRequest('Validation failed', errors);

    value.updatedBy = req.user?._id;
    const doc = await model.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true });
    if (!doc) throw ApiError.notFound(`${submodule.name} not found`);

    res.locals.resourceId = doc._id;
    res.locals.resourceLabel = String(doc[labelField] || '');
    res.locals.auditDescription = `Updated ${submodule.name}`;

    const populated = await populateQuery(model.findById(doc._id));
    return ok(res, applyComputed(populated));
  });

  const remove = asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest('Invalid identifier');
    const doc = await model.findByIdAndDelete(req.params.id);
    if (!doc) throw ApiError.notFound(`${submodule.name} not found`);

    res.locals.resourceId = doc._id;
    res.locals.resourceLabel = String(doc[labelField] || '');
    res.locals.auditDescription = `Deleted ${submodule.name}`;

    return ok(res, { id: String(doc._id), deleted: true });
  });

  /** Lightweight option list used to populate `ref` dropdowns. */
  const options = asyncHandler(async (req, res) => {
    const search = typeof req.query.q === 'string' ? req.query.q : '';
    const filter = {};

    if (search && searchable.length) {
      filter.$or = searchable.map((field) => ({ [field]: new RegExp(escapeRegexLocal(search), 'i') }));
    }
    if (model.schema.path('status')) filter.status = 'active';

    const items = await model
      .find(filter)
      .select([labelField, ...searchable].join(' '))
      .sort(defaultSort)
      .limit(50)
      .lean();

    return ok(
      res,
      items.map((item) => ({
        id: String(item._id),
        label: String(item[labelField] ?? item._id),
      })),
    );
  });

  return { list, getOne, create, update, remove, options, computedFields };
}

module.exports = { createResourceController, applyComputed, COMPUTED, FIELD_COMPUTATIONS };
