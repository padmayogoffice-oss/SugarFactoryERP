import express from 'express';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { auditLog } from '../../middlewares/auditLog.js';
import * as controller from '../../controllers/entities/powerGenerationController.js';

const router = express.Router();
const base = "production:powerGeneration";
const guard = (action) => [authenticate, authorize(base + ':' + action)];
const audited = auditLog({ module: "production", submodule: "powerGeneration" });

router.get('/', ...guard('view'), controller.list);
router.get('/options', ...guard('view'), controller.options);
router.get('/:id', ...guard('view'), controller.getOne);
router.post('/', ...guard('create'), audited, controller.create);
router.put('/:id', ...guard('update'), audited, controller.update);
router.delete('/:id', ...guard('delete'), audited, controller.remove);

export default router;
