function ok(res, data, meta, statusCode = 200) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

function created(res, data) {
  return ok(res, data, undefined, 201);
}

function paginated(res, items, { page, limit, total }) {
  return ok(res, items, {
    page,
    limit,
    total,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
  });
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildListQuery(req, { searchableFields = [], defaultSort = '-createdAt', filterableFields = [] } = {}) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 20));

  const filter = {};

  for (const field of filterableFields) {
    if (req.query[field] === undefined || req.query[field] === '') continue;
    filter[field] = req.query[field];
  }

  if (req.query.q && searchableFields.length) {
    const pattern = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = searchableFields.map((field) => ({ [field]: pattern }));
  }

  const sort = typeof req.query.sort === 'string' && req.query.sort ? req.query.sort : defaultSort;

  return { page, limit, skip: (page - 1) * limit, filter, sort };
}

module.exports = { ok, created, paginated, buildListQuery, escapeRegex };
