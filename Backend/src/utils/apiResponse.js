/**
 * Response helpers. Every endpoint replies with the same envelope
 * (`{ success: true, data, meta? }`) and list endpoints share one query builder
 * so pagination, search and filtering behave identically across all submodules.
 */
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

/** Builds a mongoose query from list request params: page/limit, equality
 *  filters, a case-insensitive search across `searchableFields`, and sorting. */
function buildListQuery(req, { searchableFields = [], defaultSort = '-createdAt', filterableFields = [] } = {}) {
  const page = Math.max(1, Number(req.query.page) || 1);
  // Capped so a client cannot request the entire collection in one call.
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 20));

  const filter = {};

  for (const field of filterableFields) {
    if (req.query[field] === undefined || req.query[field] === '') continue;
    filter[field] = req.query[field];
  }

  if (req.query.q && searchableFields.length) {
    // Escaped so user input cannot inject regex metacharacters into the query.
    const pattern = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = searchableFields.map((field) => ({ [field]: pattern }));
  }

  const sort = typeof req.query.sort === 'string' && req.query.sort ? req.query.sort : defaultSort;

  return { page, limit, skip: (page - 1) * limit, filter, sort };
}

export { ok, created, paginated, buildListQuery, escapeRegex };
