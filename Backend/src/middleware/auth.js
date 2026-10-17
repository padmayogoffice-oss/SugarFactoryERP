/**
 * Authentication and authorisation middleware.
 *
 * `authenticate` turns a bearer token into `req.user` + `req.auth`;
 * `authorize` then gates a route on the permission keys it requires. Every
 * generated resource route is wrapped in both, so the API — not the UI — is the
 * enforcement point for access control.
 */
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../services/tokenService');
const { resolvePermissions, hasPermission } = require('../services/permissionService');

function extractBearerToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

/**
 * Verifies the access token, loads the user and attaches `req.user` plus the
 * resolved `req.auth` context (permissions and roles) to the request.
 */
const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractBearerToken(req);
  if (!token) throw ApiError.unauthorized('Missing access token');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    if (error.name === 'TokenExpiredError') throw ApiError.unauthorized('Access token expired');
    throw ApiError.unauthorized('Invalid access token');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if (user.status !== 'active') throw ApiError.forbidden('Your account is not active');
  if (user.isLocked()) throw ApiError.forbidden('Your account is temporarily locked');
  // Tokens issued before a password reset must not stay valid.
  if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime()) {
    throw ApiError.unauthorized('Session expired after password change');
  }

  const auth = await resolvePermissions(user);
  req.user = user;
  req.auth = auth;
  next();
});

/** Requires the exact permission key, e.g. `cane:farmer:create`. */
function authorize(required) {
  const requirements = Array.isArray(required) ? required : [required];
  return (req, _res, next) => {
    const permissions = req.auth?.permissions;
    // Any one of the listed permissions is sufficient (used for shared pages).
    const allowed = requirements.some((requirement) => hasPermission(permissions, requirement));
    if (!allowed) {
      return next(ApiError.forbidden(`Missing permission: ${requirements.join(' or ')}`));
    }
    return next();
  };
}

module.exports = { authenticate, authorize, extractBearerToken };
