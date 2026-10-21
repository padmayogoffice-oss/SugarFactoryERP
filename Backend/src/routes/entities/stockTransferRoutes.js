import express from 'express';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { auditLog } from '../../middlewares/auditLog.js';
import * as controller from '../../controllers/entities/stockTransferController.js';

const router = express.Router();
const base = "stores:stockTransfer";
const guard = (action) => [authenticate, authorize(base + ':' + action)];
const audited = auditLog({ module: "stores", submodule: "stockTransfer" });

router.get('/', ...guard('view'), controller.list);
router.get('/options', ...guard('view'), controller.options);
router.get('/:id', ...guard('view'), controller.getOne);
router.post('/', ...guard('create'), audited, controller.create);
router.put('/:id', ...guard('update'), audited, controller.update);
router.delete('/:id', ...guard('delete'), audited, controller.remove);

export default router;
