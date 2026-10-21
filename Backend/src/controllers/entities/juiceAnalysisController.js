import mongoose from 'mongoose';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { validatePayload } from '../../validators/fieldValidator.js';
import { ok, created, paginated, buildListQuery, escapeRegex } from '../../utils/apiResponse.js';
import { applyComputed } from '../../utils/computedFields.js';
import { model, submodule } from '../../models/entities/JuiceAnalysis.js';

function populateQuery(query) {
  for (const field of submodule.fields) {
    if (field.type === 'ref' || field.type === 'refs') {
      query.populate({ path: field.name, select: 'name code label ' + (field.refLabel || 'name') });
    }
  }
  return query;
}

export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip, filter, sort } = buildListQuery(req, {
    searchableFields: submodule.searchable,
    filterableFields: submodule.filterable,
    defaultSort: submodule.defaultSort,
  });
  const [items, total] = await Promise.all([
    populateQuery(model.find(filter).sort(sort).skip(skip).limit(limit)).lean(),
    model.countDocuments(filter),
  ]);
  return paginated(res, items.map(applyComputed), { page, limit, total });
});

export const getOne = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest('Invalid identifier');
  const doc = await populateQuery(model.findById(req.params.id));
  if (!doc) throw ApiError.notFound("Juice / Pan Analysis not found");
  return ok(res, applyComputed(doc));
});

export const create = asyncHandler(async (req, res) => {
  const { errors, value } = validatePayload(submodule.fields, req.body);
  if (errors.length) throw ApiError.badRequest('Validation failed', errors);
  value.createdBy = req.user?._id;
  const doc = await model.create(value);
  res.locals.resourceId = doc._id;
  res.locals.resourceLabel = String(doc[submodule.labelField] || '');
  res.locals.auditDescription = 'Created ' + submodule.name;
  const populated = await populateQuery(model.findById(doc._id));
  return created(res, applyComputed(populated));
});

export const update = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest('Invalid identifier');
  const { errors, value } = validatePayload(submodule.fields, req.body, { partial: true });
  if (errors.length) throw ApiError.badRequest('Validation failed', errors);
  value.updatedBy = req.user?._id;
  const doc = await model.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true });
  if (!doc) throw ApiError.notFound("Juice / Pan Analysis not found");
  res.locals.resourceId = doc._id;
  res.locals.resourceLabel = String(doc[submodule.labelField] || '');
  res.locals.auditDescription = 'Updated ' + submodule.name;
  const populated = await populateQuery(model.findById(doc._id));
  return ok(res, applyComputed(populated));
});

export const remove = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest('Invalid identifier');
  const doc = await model.findByIdAndDelete(req.params.id);
  if (!doc) throw ApiError.notFound("Juice / Pan Analysis not found");
  res.locals.resourceId = doc._id;
  res.locals.resourceLabel = String(doc[submodule.labelField] || '');
  res.locals.auditDescription = 'Deleted ' + submodule.name;
  return ok(res, { id: String(doc._id), deleted: true });
});

export const options = asyncHandler(async (req, res) => {
  const search = typeof req.query.q === 'string' ? req.query.q : '';
  const filter = {};
  if (search && submodule.searchable.length) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = submodule.searchable.map((field) => ({ [field]: pattern }));
  }
  if (model.schema.path('status')) filter.status = 'active';
  const items = await model.find(filter)
    .select([submodule.labelField, ...submodule.searchable].join(' '))
    .sort(submodule.defaultSort)
    .limit(50)
    .lean();
  return ok(res, items.map((item) => ({ id: String(item._id), label: String(item[submodule.labelField] ?? item._id) })));
});
