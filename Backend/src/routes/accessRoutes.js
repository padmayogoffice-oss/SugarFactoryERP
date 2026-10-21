/**
 * Access-control route composition. User, role, permission, and activity-log
 * endpoints are kept in their own route modules.
 */
import express from 'express';
import userRoutes from './userRoutes.js';
import roleRoutes from './roleRoutes.js';
import permissionRoutes from './permissionRoutes.js';
import activityLogRoutes from './activityLogRoutes.js';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/activity-logs', activityLogRoutes);

export default router;
