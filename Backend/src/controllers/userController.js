import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created, paginated, buildListQuery, escapeRegex } from '../utils/apiResponse.js';
import User from '../models/User.js';
import { getSubmodule } from '../registry/index.js';
import { validatePayload } from '../validators/fieldValidator.js';

const PASSWORD_MIN_LENGTH = 8;
const SAFE_USER_FIELDS = 'employeeCode firstName lastName firstNameMr lastNameMr email phone gender department designation roles isSuperAdmin status lastLoginAt createdAt updatedAt remarks remarksMr';
const userSubmodule = getSubmodule('user').submodule;

function publicUser(user) {
  const plain = user.toObject ? user.toObject({ virtuals: true }) : { ...user };
  delete plain.passwordHash;
  delete plain.failedLoginAttempts;
  delete plain.lockedUntil;
  return plain;
}

const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip, filter, sort } = buildListQuery(req, {
    searchableFields: ['employeeCode', 'firstName', 'lastName', 'firstNameMr', 'lastNameMr', 'email', 'phone'],
    filterableFields: ['status', 'gender'],
    defaultSort: '-createdAt',
  });

  if (req.query.role && mongoose.isValidObjectId(req.query.role)) filter.roles = req.query.role;
  if (req.query.q) {
    const pattern = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = ['employeeCode', 'firstName', 'lastName', 'firstNameMr', 'lastNameMr', 'email', 'phone'].map((field) => ({ [field]: pattern }));
  }

  const [items, total] = await Promise.all([
    User.find(filter).select(SAFE_USER_FIELDS).populate('roles', 'code name').populate('department', 'name').populate('designation', 'name').sort(sort).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return paginated(res, items, { page, limit, total });
});

const userOptions = asyncHandler(async (_req, res) => {
  const items = await User.find({ status: 'active' })
    .select('employeeCode firstName lastName')
    .sort('firstName')
    .limit(50)
    .lean();
  return ok(res, items.map((item) => ({ id: String(item._id), label: `${item.firstName} ${item.lastName || ''}`.trim() })));
});

const getUser = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest('Invalid identifier');
  const user = await User.findById(req.params.id).select(SAFE_USER_FIELDS).populate('roles', 'code name');
  if (!user) throw ApiError.notFound('User not found');
  return ok(res, publicUser(user));
});

const createUser = asyncHandler(async (req, res) => {
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
});

const updateUser = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest('Invalid identifier');
  const body = req.body || {};

  const { errors, value } = validatePayload(userSubmodule.fields, body, { partial: true });
  if (errors.length) throw ApiError.badRequest('Validation failed', errors);
  if (value.email) value.email = String(value.email).toLowerCase();

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user.isSuperAdmin && body.status && body.status !== 'active') {
    throw ApiError.forbidden('The super admin account cannot be deactivated');
  }

  Object.assign(user, value);
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
});

const deleteUser = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest('Invalid identifier');
  if (String(req.params.id) === String(req.user._id)) throw ApiError.badRequest('You cannot delete your own account');

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user.isSuperAdmin) throw ApiError.forbidden('The super admin account cannot be deleted');

  await user.deleteOne();
  res.locals.resourceId = req.params.id;
  res.locals.auditDescription = 'Deleted user';

  return ok(res, { id: req.params.id, deleted: true });
});

export { listUsers, userOptions, getUser, createUser, updateUser, deleteUser };
