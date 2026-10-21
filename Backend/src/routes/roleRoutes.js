import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { auditLog } from '../middlewares/auditLog.js';
import { listRoles, roleOptions, getRole, createRole, updateRole, deleteRole } from '../controllers/roleController.js';

const router = express.Router();

router.get('/', authenticate, authorize('access:role:view'), listRoles);
router.get('/options', authenticate, authorize('access:role:view'), roleOptions);
router.get('/:id', authenticate, authorize('access:role:view'), getRole);
router.post('/', authenticate, authorize('access:role:create'), auditLog({ module: 'access', submodule: 'role' }), createRole);
router.put('/:id', authenticate, authorize('access:role:update'), auditLog({ module: 'access', submodule: 'role' }), updateRole);
router.delete('/:id', authenticate, authorize('access:role:delete'), auditLog({ module: 'access', submodule: 'role' }), deleteRole);

export default router;
