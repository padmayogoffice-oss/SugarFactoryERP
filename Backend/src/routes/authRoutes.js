/**
 * Authentication endpoint registration. Authentication workflows and
 * request/response handling are implemented in their respective modules.
 */
import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { auditLog } from '../middlewares/auditLog.js';
import { login, register, refresh, logout, currentUser, changePassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', auditLog({ module: 'access', submodule: 'auth' }), login);
router.post('/register', auditLog({ module: 'access', submodule: 'auth' }), register);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, currentUser);
router.post('/change-password', authenticate, auditLog({ module: 'access', submodule: 'auth' }), changePassword);

export default router;
