import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { auditLog } from '../middlewares/auditLog.js';
import { listUsers, userOptions, getUser, createUser, updateUser, deleteUser } from '../controllers/userController.js';

const router = express.Router();

router.get('/', authenticate, authorize('access:user:view'), listUsers);
router.get('/options', authenticate, authorize('access:user:view'), userOptions);
router.get('/:id', authenticate, authorize('access:user:view'), getUser);
router.post('/', authenticate, authorize('access:user:create'), auditLog({ module: 'access', submodule: 'user' }), createUser);
router.put('/:id', authenticate, authorize('access:user:update'), auditLog({ module: 'access', submodule: 'user' }), updateUser);
router.delete('/:id', authenticate, authorize('access:user:delete'), auditLog({ module: 'access', submodule: 'user' }), deleteUser);

export default router;
