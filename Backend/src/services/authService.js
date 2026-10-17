/**
 * Authentication service: login, registration, refresh, logout and password
 * change. Failed logins increment a lockout counter, and every credential change
 * revokes the user's refresh tokens.
 */
import User from '../models/User.js';
import Role from '../models/Role.js';
import ApiError from '../utils/ApiError.js';
import { resolvePermissions } from './permissionService.js';
import { signAccessToken, issueRefreshToken, rotateRefreshToken, revokeRefreshToken, revokeAllForUser } from './tokenService.js';

const MAX_FAILED_ATTEMPTS = 8;
const LOCK_MINUTES = 15;

function requestContext(req) {
  return { userAgent: req.get('user-agent') || '', ipAddress: req.ip || '' };
}

async function buildSession(user, req) {
  const accessToken = signAccessToken(user);
  const refresh = await issueRefreshToken(user._id, requestContext(req));
  const auth = await resolvePermissions(user);

  return {
    user: {
      id: String(user._id),
      employeeCode: user.employeeCode,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(' '),
      email: user.email,
      phone: user.phone,
      status: user.status,
      isSuperAdmin: Boolean(user.isSuperAdmin),
      roles: auth.roles,
    },
    permissions: auth.permissions,
    accessToken,
    refreshToken: refresh.token,
    accessTokenExpiresIn: process.env.JWT_ACCESS_TTL || '30m',
    refreshTokenExpiresAt: refresh.expiresAt,
  };
}

async function login({ email, password }, req) {
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+passwordHash');

  // Same error for unknown user and wrong password: avoids account enumeration.
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  if (user.isLocked()) {
    throw ApiError.forbidden('Account temporarily locked after repeated failed logins. Try again later.');
  }

  const matches = await user.verifyPassword(password);
  if (!matches) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (user.status !== 'active') throw ApiError.forbidden('Your account is not active');

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  return buildSession(user, req);
}

async function register(payload, req) {
  const email = String(payload.email).toLowerCase().trim();

  const existing = await User.findOne({ $or: [{ email }, { employeeCode: payload.employeeCode }] });
  if (existing) throw ApiError.conflict('A user with this email or employee code already exists');

  const user = new User({
    employeeCode: payload.employeeCode,
    firstName: payload.firstName,
    lastName: payload.lastName || '',
    email,
    phone: payload.phone || '',
    gender: payload.gender || '',
    roles: payload.roles || [],
    isSuperAdmin: false,
    status: 'active',
  });
  await user.setPassword(payload.password);
  await user.save();

  return buildSession(user, req);
}

async function refresh(rawToken, req) {
  if (!rawToken) throw ApiError.unauthorized('Missing refresh token');

  const result = await rotateRefreshToken(rawToken, requestContext(req));
  if (result.error === 'reused') {
    throw ApiError.unauthorized('Refresh token reuse detected. All sessions have been revoked.');
  }
  if (result.error) throw ApiError.unauthorized('Invalid or expired refresh token');

  const user = await User.findById(result.userId);
  if (!user || user.status !== 'active') throw ApiError.unauthorized('User is not active');

  const auth = await resolvePermissions(user);

  return {
    accessToken: signAccessToken(user),
    refreshToken: result.token,
    refreshTokenExpiresAt: result.expiresAt,
    permissions: auth.permissions,
    user: {
      id: String(user._id),
      employeeCode: user.employeeCode,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(' '),
      email: user.email,
      isSuperAdmin: Boolean(user.isSuperAdmin),
      roles: auth.roles,
    },
  };
}

async function logout(rawToken) {
  if (rawToken) await revokeRefreshToken(rawToken);
  return { loggedOut: true };
}

async function changePassword(user, { currentPassword, newPassword }) {
  const fresh = await User.findById(user._id).select('+passwordHash');
  const matches = await fresh.verifyPassword(currentPassword);
  if (!matches) throw ApiError.badRequest('Current password is incorrect');

  await fresh.setPassword(newPassword);
  await fresh.save();
  // Existing sessions are invalidated by the passwordChangedAt check.
  await revokeAllForUser(fresh._id);

  return { changed: true };
}

async function currentUser(user) {
  const auth = await resolvePermissions(user);
  const roles = await Role.find({ _id: { $in: user.roles || [] } }).lean();

  return {
    user: {
      id: String(user._id),
      employeeCode: user.employeeCode,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(' '),
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      status: user.status,
      isSuperAdmin: Boolean(user.isSuperAdmin),
      lastLoginAt: user.lastLoginAt,
      roles: roles.map((role) => ({ id: String(role._id), code: role.code, name: role.name })),
    },
    permissions: auth.permissions,
  };
}

export { login, register, refresh, logout, changePassword, currentUser, buildSession };
