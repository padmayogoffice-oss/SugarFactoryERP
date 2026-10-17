const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const authService = require('../services/authService');
const { authenticate } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

const router = express.Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

function assertValidCredentials({ email, password }) {
  if (!email || !EMAIL_PATTERN.test(String(email))) throw ApiError.badRequest('A valid email address is required');
  if (!password || String(password).length < PASSWORD_MIN_LENGTH) {
    throw ApiError.badRequest(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
}

router.post(
  '/login',
  auditLog({ module: 'access', submodule: 'auth' }),
  asyncHandler(async (req, res) => {
    assertValidCredentials(req.body || {});
    const session = await authService.login(req.body, req);
    res.locals.auditDescription = 'User login';
    return ok(res, session);
  }),
);

router.post(
  '/register',
  auditLog({ module: 'access', submodule: 'auth' }),
  asyncHandler(async (req, res) => {
    const { employeeCode, firstName, email, password } = req.body || {};
    assertValidCredentials({ email, password });
    if (!employeeCode) throw ApiError.badRequest('Employee code is required');
    if (!firstName) throw ApiError.badRequest('First name is required');

    const session = await authService.register(req.body, req);
    res.locals.resourceId = session.user.id;
    res.locals.auditDescription = 'User self-registration';
    return created(res, session);
  }),
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.body?.refreshToken;
    const session = await authService.refresh(token, req);
    return ok(res, session);
  }),
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const result = await authService.logout(req.body?.refreshToken);
    return ok(res, result);
  }),
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => ok(res, await authService.currentUser(req.user))),
);

router.post(
  '/change-password',
  authenticate,
  auditLog({ module: 'access', submodule: 'auth' }),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword) throw ApiError.badRequest('Current password is required');
    if (!newPassword || String(newPassword).length < PASSWORD_MIN_LENGTH) {
      throw ApiError.badRequest(`New password must be at least ${PASSWORD_MIN_LENGTH} characters`);
    }
    res.locals.auditDescription = 'Password changed';
    return ok(res, await authService.changePassword(req.user, req.body));
  }),
);

module.exports = router;
