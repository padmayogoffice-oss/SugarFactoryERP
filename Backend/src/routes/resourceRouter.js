/**
 * Generic REST router factory for registry submodules.
 *
 * Every route is guarded by `authenticate` and a permission derived from the
 * module/submodule key, and every write is audited. This one factory backs all
 * 88 generated resources, so access control cannot be forgotten on a new one.
 */
const express = require('express');
const { createResourceController } = require('../controllers/resourceController');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

/**
 * Builds a router with the standard REST surface for one registry submodule:
 *
 *   GET    /            list (search, filter, paginate)
 *   GET    /options     id/label pairs for reference dropdowns
 *   GET    /:id         single record
 *   POST   /            create
 *   PUT    /:id         update
 *   DELETE /:id         delete
 *
 * Every route is permission checked against `<module>:<submodule>:<action>`.
 */
function createResourceRouter({ model, submodule, module: moduleDef }) {
  const router = express.Router();
  const controller = createResourceController({ model, submodule });
  const base = `${moduleDef.key}:${submodule.key}`;

  const guard = (action) => [authenticate, authorize(`${base}:${action}`)];
  const audited = auditLog({ module: moduleDef.key, submodule: submodule.key });

  router.get('/', ...guard('view'), controller.list);
  router.get('/options', ...guard('view'), controller.options);
  router.get('/:id', ...guard('view'), controller.getOne);
  router.post('/', ...guard('create'), audited, controller.create);
  router.put('/:id', ...guard('update'), audited, controller.update);
  router.delete('/:id', ...guard('delete'), audited, controller.remove);

  return router;
}

module.exports = { createResourceRouter };
