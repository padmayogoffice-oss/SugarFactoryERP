/**
 * Users & Access Control routes. These are hand-written rather than generated
 * because user and role writes need password hashing, role validation and
 * self-protection rules (for example, you cannot delete your own account or the
 * built-in Super Admin role).
 */
import express from 'express';
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created, paginated, buildListQuery, escapeRegex } from '../utils/apiResponse.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import ActivityLog from '../models/ActivityLog.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { auditLog } from '../middleware/auditLog.js';
import { permissionCatalog, getSubmodule, modules } from '../registry/index.js';
import { validatePayload } from '../registry/fields.js';

const router = express.Router();

const PASSWORD_MIN_LENGTH = 8;
const SAFE_USER_FIELDS = 'employeeCode firstName lastName email phone gender department designation roles isSuperAdmin status lastLoginAt createdAt updatedAt remarks';

function publicUser(user) {
  const plain = user.toObject ? user.toObject({ virtuals: true }) : { ...user };
  delete plain.passwordHash;
  delete plain.failedLoginAttempts;
  delete plain.lockedUntil;
  return plain;
}

/* ---------------------------------------------------------------- users --- */

const userSubmodule = getSubmodule('user').submodule;

router.get('/users', authenticate, authorize('access:user:view'), asyncHandler(async (req, res) => {
  const { page, limit, skip, filter, sort } = buildListQuery(req, {
    searchableFields: ['employeeCode', 'firstName', 'lastName', 'email', 'phone'],
    filterableFields: ['status', 'gender'],
    defaultSort: '-createdAt',
  });

  if (req.query.role && mongoose.isValidObjectId(req.query.role)) filter.roles = req.query.role;
  if (req.query.q) {
    const pattern = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = ['employeeCode', 'firstName', 'lastName', 'email', 'phone'].map((field) => ({ [field]: pattern }));
  }

  const [items, total] = await Promise.all([
    User.find(filter).select(SAFE_USER_FIELDS).populate('roles', 'code name').populate('department', 'name').populate('designation', 'name').sort(sort).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return paginated(res, items, { page, limit, total });
}));

router.get('/users/options', authenticate, authorize('access:user:view'), asyncHandler(async (req, res) => {
  const items = await User.find({ status: 'active' })
    .select('employeeCode firstName lastName')
    .sort('firstName')
    .limit(50)
    .lean();
  return ok(res, items.map((item) => ({ id: String(item._id), label: `${item.firstName} ${item.lastName || ''}`.trim() })));
}));

router.get('/users/:id', authenticate, authorize('access:user:view'), asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest('Invalid identifier');
  const user = await User.findById(req.params.id).select(SAFE_USER_FIELDS).populate('roles', 'code name');
  if (!user) throw ApiError.notFound('User not found');
  return ok(res, publicUser(user));
}));

router.post('/users', authenticate, authorize('access:user:create'), auditLog({ module: 'access', submodule: 'user' }), asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.password || String(body.password).length < PASSWORD_MIN_LENGTH) {
    throw ApiError.badRequest(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }

  const { errors, value } = validatePayload(userSubmodule.fields, body);
  if (errors.length) throw ApiError.badRequest('Validation failed', errors);

  const existing = await User.findOne({ $or: [{ email: String(body.email).toLowerCase() }, { employeeCode: value.employeeCode }] });
  if (existing) throw ApiError.conflict('A user with this email or employee code already exists');

  const user = new User({ ...value, email: String(body.email).toLowerCase() });
  await user.setPassword(body.password);
  await user.save();

  res.locals.resourceId = user._id;
  res.locals.resourceLabel = user.employeeCode;
  res.locals.auditDescription = 'Created user';

  return created(res, publicUser(await user.populate('roles', 'code name')));
}));

router.put('/users/:id', authenticate, authorize('access:user:update'), auditLog({ module: 'access', submodule: 'user' }), asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest('Invalid identifier');
  const body = req.body || {};

  const { errors, value } = validatePayload(userSubmodule.fields, body, { partial: true });
  if (errors.length) throw ApiError.badRequest('Validation failed', errors);
  if (value.email) value.email = String(value.email).toLowerCase();

  const update = { ...value };

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user.isSuperAdmin && body.status && body.status !== 'active') {
    throw ApiError.forbidden('The super admin account cannot be deactivated');
  }

  Object.assign(user, update);
  if (body.password) {
    if (String(body.password).length < PASSWORD_MIN_LENGTH) {
      throw ApiError.badRequest(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
    }
    await user.setPassword(body.password);
  }
  await user.save();

  res.locals.resourceId = user._id;
  res.locals.auditDescription = 'Updated user';

  return ok(res, publicUser(await user.populate('roles', 'code name')));
}));

router.delete('/users/:id', authenticate, authorize('access:user:delete'), auditLog({ module: 'access', submodule: 'user' }), asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest('Invalid identifier');
  if (String(req.params.id) === String(req.user._id)) throw ApiError.badRequest('You cannot delete your own account');

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user.isSuperAdmin) throw ApiError.forbidden('The super admin account cannot be deleted');

  await user.deleteOne();
  res.locals.resourceId = req.params.id;
  res.locals.auditDescription = 'Deleted user';

  return ok(res, { id: req.params.id, deleted: true });
}));

/* ---------------------------------------------------------------- roles --- */

router.get('/roles', authenticate, authorize('access:role:view'), asyncHandler(async (req, res) => {
  const { page, limit, skip, filter, sort } = buildListQuery(req, {
    searchableFields: ['code', 'name', 'description'],
    filterableFields: ['status'],
    defaultSort: 'name',
  });

  const [items, total] = await Promise.all([
    Role.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Role.countDocuments(filter),
  ]);

  return paginated(res, items.map((role) => ({ ...role, permissionCount: (role.permissions || []).length })), { page, limit, total });
}));

router.get('/roles/options', authenticate, authorize('access:role:view'), asyncHandler(async (_req, res) => {
  const roles = await Role.find({ status: 'active' }).select('code name').sort('name').lean();
  return ok(res, roles.map((role) => ({ id: String(role._id), label: role.name })));
}));

router.get('/roles/:id', authenticate, authorize('access:role:view'), asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest('Invalid identifier');
  const role = await Role.findById(req.params.id).lean();
  if (!role) throw ApiError.notFound('Role not found');
  return ok(res, role);
}));

/** Validates submitted permission keys against the registry catalog. */
function assertValidPermissions(permissions) {
  if (!Array.isArray(permissions)) throw ApiError.badRequest('permissions must be an array');
  const known = new Set(permissionCatalog.map((entry) => entry.key));
  const unknown = permissions.filter((permission) => permission !== '*' && !known.has(permission));
  if (unknown.length) throw ApiError.badRequest('Unknown permission keys', unknown);
}

router.post('/roles', authenticate, authorize('access:role:create'), auditLog({ module: 'access', submodule: 'role' }), asyncHandler(async (req, res) => {
  const { code, name, description, permissions, status } = req.body || {};
  if (!code) throw ApiError.badRequest('Role code is required');
  if (!name) throw ApiError.badRequest('Role name is required');
  assertValidPermissions(permissions || []);

  const existing = await Role.findOne({ code: String(code).toUpperCase() });
  if (existing) throw ApiError.conflict('A role with this code already exists');

  const role = await Role.create({
    code: String(code).toUpperCase(),
    name,
    description: description || '',
    permissions: permissions || [],
    status: status || 'active',
  });

  res.locals.resourceId = role._id;
  res.locals.resourceLabel = role.name;
  res.locals.auditDescription = 'Created role';

  return created(res, role);
}));

router.put('/roles/:id', authenticate, authorize('access:role:update'), auditLog({ module: 'access', submodule: 'role' }), asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest('Invalid identifier');
  const role = await Role.findById(req.params.id);
  if (!role) throw ApiError.notFound('Role not found');

  const { name, description, permissions, status } = req.body || {};
  if (permissions !== undefined) {
    assertValidPermissions(permissions);
    if (role.isSystem && permissions.includes('*') === false) {
      throw ApiError.forbidden('The Super Admin role must keep full access');
    }
    role.permissions = permissions;
  }
  if (name !== undefined) role.name = name;
  if (description !== undefined) role.description = description;
  if (status !== undefined) {
    if (role.isSystem && status !== 'active') throw ApiError.forbidden('System roles cannot be deactivated');
    role.status = status;
  }

  await role.save();
  res.locals.resourceId = role._id;
  res.locals.auditDescription = 'Updated role';

  return ok(res, role);
}));

router.delete('/roles/:id', authenticate, authorize('access:role:delete'), auditLog({ module: 'access', submodule: 'role' }), asyncHandler(async (req, res) => {
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
}));

/* ------------------------------------------------- permission & audit log --- */

router.get('/permissions', authenticate, authorize('access:permission:view'), asyncHandler(async (_req, res) => {
  const grouped = modules.map((moduleDef) => ({
    module: moduleDef.key,
    name: moduleDef.name,
    submodules: moduleDef.submodules.map((submodule) => ({
      key: submodule.key,
      name: submodule.name,
      permissions: submodule.actions.map((action) => `${moduleDef.key}:${submodule.key}:${action}`),
    })),
    pages: moduleDef.pages.map((page) => ({
      key: page.key,
      name: page.name,
      permissions: [`${moduleDef.key}:${page.key}:view`],
    })),
  }));

  return ok(res, { total: permissionCatalog.length, groups: grouped });
}));

router.get('/activity-logs', authenticate, authorize('access:activityLog:view'), asyncHandler(async (req, res) => {
  const { page, limit, skip, filter, sort } = buildListQuery(req, {
    searchableFields: ['userName', 'userEmail', 'description', 'resourceLabel'],
    filterableFields: ['module', 'submodule', 'action'],
    defaultSort: '-createdAt',
  });

  const [items, total] = await Promise.all([
    ActivityLog.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    ActivityLog.countDocuments(filter),
  ]);

  return paginated(res, items, { page, limit, total });
}));

export default router;
