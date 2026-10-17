/**
 * Authentication routes. Credentials are validated here before reaching the
 * service, login/register/change-password writes are audited, and refresh and
 * logout stay unauthenticated because they operate on the refresh token itself.
 */
import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';
import ApiError from '../utils/ApiError.js';
import * as authService from '../services/authService.js';
import { authenticate } from '../middleware/auth.js';
import { auditLog } from '../middleware/auditLog.js';

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

export default router;
