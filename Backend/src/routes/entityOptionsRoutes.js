/**
 * Option lists for reference dropdowns, shared by every entity.
 *
 *   GET /api/<module>/<submodule>/options
 *     q        text search across the entity's searchable fields
 *     ids      comma separated ids: resolves a current selection exactly, even
 *              when it is not on the first page of results
 *     limit    page size (default 25, max 100)
 *     <ref>    narrows by a parent reference, e.g. ?farmer=<id> on contracts
 *
 * Each option carries `values`: only the fields other forms are declared to copy
 * from this record (see registry/relations.js), never the whole record. Mounted
 * ahead of each entity router, so it replaces that router's label-only,
 * 50-record `options` handler without changing the entity files.
 */
import express from 'express';
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, escapeRegex } from '../utils/apiResponse.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const idString = (value) => (value === null || value === undefined ? null : String(value._id || value));

function buildOptionsRouter({ moduleKey, submodule, model }) {
  const router = express.Router();
  const { searchable, defaultSort, labelField } = submodule;
  const singleRefNames = new Set(submodule.fields.filter((field) => field.type === 'ref').map((field) => field.name));
  const exposedFields = (submodule.exposedFields || []).filter((name) => model.schema.path(name));
  const describe = ['name', 'firstName', 'lastName', 'title'].filter((name) => model.schema.path(name));
  const select = [...new Set([labelField, ...describe, ...searchable, ...exposedFields])].filter((name) => model.schema.path(name));

  router.get(
    '/options',
    authenticate,
    authorize(`${moduleKey}:${submodule.key}:view`),
    asyncHandler(async (req, res) => {
      const search = [req.query.q, req.query.search].find((value) => typeof value === 'string' && value.trim());
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
      const ids = String(req.query.ids || '')
        .split(',')
        .map((value) => value.trim())
        .filter((value) => mongoose.isValidObjectId(value));

      const filter = {};
      if (ids.length) {
        filter._id = { $in: ids };
      } else {
        if (search && searchable.length) {
          const pattern = new RegExp(escapeRegex(search.trim()), 'i');
          filter.$or = searchable.map((field) => ({ [field]: pattern }));
        }
        // Hide records that should not be picked for new work: inactive masters and
        // cancelled documents (only where the status field actually has those values).
        const statusValues = model.schema.path('status')?.enumValues || [];
        const hidden = ['inactive', 'cancelled'].filter((value) => statusValues.includes(value));
        if (hidden.length) filter.status = { $nin: hidden };
        else if (model.schema.path('status') && statusValues.length === 0) filter.status = { $nin: ['inactive', 'cancelled'] };
      }

      for (const [param, raw] of Object.entries(req.query)) {
        if (!singleRefNames.has(param) || typeof raw !== 'string' || !mongoose.isValidObjectId(raw)) continue;
        filter[param] = raw;
      }

      const items = await model.find(filter).select(select.join(' ')).sort(defaultSort).limit(limit).lean();

      return ok(
        res,
        items.map((item) => {
          const label = String(item[labelField] ?? item._id);
          const description = [item.name, [item.firstName, item.lastName].filter(Boolean).join(' '), item.title]
            .map((part) => (part ? String(part).trim() : ''))
            .find((part) => part && part !== label);
          const values = {};
          for (const name of exposedFields) {
            const raw = item[name];
            if (raw === undefined || raw === null) continue;
            values[name] = raw instanceof Date ? raw.toISOString().slice(0, 10) : idString(raw);
          }
          return { id: String(item._id), label, description: description || undefined, values };
        }),
      );
    }),
  );

  return router;
}

export { buildOptionsRouter };