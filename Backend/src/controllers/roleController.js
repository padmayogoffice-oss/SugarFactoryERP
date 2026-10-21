import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created, paginated, buildListQuery } from '../utils/apiResponse.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { permissionCatalog } from '../registry/index.js';

function assertValidPermissions(permissions) {
  if (!Array.isArray(permissions)) throw ApiError.badRequest('permissions must be an array');
  const known = new Set(permissionCatalog.map((entry) => entry.key));
  const unknown = permissions.filter((permission) => permission !== '*' && !known.has(permission));
  if (unknown.length) throw ApiError.badRequest('Unknown permission keys', unknown);
}

const listRoles = asyncHandler(async (req, res) => {
  const { page, limit, skip, filter, sort } = buildListQuery(req, {
    searchableFields: ['code', 'name', 'description', 'nameMr', 'descriptionMr'],
    filterableFields: ['status'],
    defaultSort: 'name',
  });

  const [items, total] = await Promise.all([
    Role.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Role.countDocuments(filter),
  ]);

  return paginated(res, items.map((role) => ({ ...role, permissionCount: (role.permissions || []).length })), { page, limit, total });
});

const roleOptions = asyncHandler(async (_req, res) => {
  const roles = await Role.find({ status: 'active' }).select('code name').sort('name').lean();
  return ok(res, roles.map((role) => ({ id: String(role._id), label: role.name })));
});

const getRole = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest('Invalid identifier');
  const role = await Role.findById(req.params.id).lean();
  if (!role) throw ApiError.notFound('Role not found');
  return ok(res, role);
});

const createRole = asyncHandler(async (req, res) => {
  const { code, name, description, permissions, status, nameMr, descriptionMr } = req.body || {};
  if (!code) throw ApiError.badRequest('Role code is required');
  if (!name) throw ApiError.badRequest('Role name is required');
  assertValidPermissions(permissions || []);

  const existing = await Role.findOne({ code: String(code).toUpperCase() });
  if (existing) throw ApiError.conflict('A role with this code already exists');

  const role = await Role.create({
    code: String(code).toUpperCase(),
    name,
    description: description || '',
    nameMr: typeof nameMr === 'string' ? nameMr.trim() : '',
    descriptionMr: typeof descriptionMr === 'string' ? descriptionMr.trim() : '',
    permissions: permissions || [],
    status: status || 'active',
  });

  res.locals.resourceId = role._id;
  res.locals.resourceLabel = role.name;
  res.locals.auditDescription = 'Created role';

  return created(res, role);
});

const updateRole = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest('Invalid identifier');
  const role = await Role.findById(req.params.id);
  if (!role) throw ApiError.notFound('Role not found');

  const { name, description, permissions, status, nameMr, descriptionMr } = req.body || {};
  if (permissions !== undefined) {
    assertValidPermissions(permissions);
    if (role.isSystem && permissions.includes('*') === false) {
      throw ApiError.forbidden('The Super Admin role must keep full access');
    }
    role.permissions = permissions;
  }
  if (name !== undefined) role.name = name;
  if (description !== undefined) role.description = description;
  if (typeof nameMr === 'string') role.nameMr = nameMr.trim();
  if (typeof descriptionMr === 'string') role.descriptionMr = descriptionMr.trim();
  if (status !== undefined) {
    if (role.isSystem && status !== 'active') throw ApiError.forbidden('System roles cannot be deactivated');
    role.status = status;
  }

  await role.save();
  res.locals.resourceId = role._id;
  res.locals.auditDescription = 'Updated role';

  return ok(res, role);
});

const deleteRole = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest('Invalid identifier');
  const role = await Role.findById(req.params.id);
  if (!role) throw ApiError.notFound('Role not found');
  if (role.isSystem) throw ApiError.forbidden('System roles cannot be deleted');

  const assigned = await User.countDocuments({ roles: role._id });
  if (assigned > 0) throw ApiError.conflict(`Role is assigned to ${assigned} user(s). Reassign them first.`);

  await role.deleteOne();
  res.locals.resourceId = req.params.id;
  res.locals.auditDescription = 'Deleted role';

  return ok(res, { id: req.params.id, deleted: true });
});

export { listRoles, roleOptions, getRole, createRole, updateRole, deleteRole };
