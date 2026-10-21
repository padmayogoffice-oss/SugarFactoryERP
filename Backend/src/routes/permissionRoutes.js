import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { listPermissions } from '../controllers/permissionController.js';

const router = express.Router();

router.get('/', authenticate, authorize('access:permission:view'), listPermissions);

export default router;
