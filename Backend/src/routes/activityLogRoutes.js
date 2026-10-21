import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { listActivityLogs } from '../controllers/activityLogController.js';

const router = express.Router();

router.get('/', authenticate, authorize('access:activityLog:view'), listActivityLogs);

export default router;
