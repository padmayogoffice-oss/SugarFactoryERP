const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');
const { authenticate } = require('../middleware/auth');
const { toClientTree } = require('../registry');
const { hasSubmoduleAccess, hasPermission } = require('../services/permissionService');

const router = express.Router();

/**
 * Returns the module tree the caller is allowed to see: submodules where they
 * hold at least one action, and report pages they may open. The frontend builds
 * its entire sidebar and route table from this response.
 */
router.get(
  '/navigation',
  authenticate,
  asyncHandler(async (req, res) => {
    const permissions = req.auth.permissions;
    const tree = toClientTree();

    const visible = tree
      .map((moduleDef) => {
        const submodules = moduleDef.submodules
          .filter((submodule) => hasSubmoduleAccess(permissions, moduleDef.key, submodule.key))
          .map((submodule) => ({
            ...submodule,
            actions: submodule.actions.filter((action) =>
              hasPermission(permissions, `${moduleDef.key}:${submodule.key}:${action}`),
            ),
          }));

        const pages = moduleDef.pages.filter((page) =>
          hasPermission(permissions, `${moduleDef.key}:${page.key}:view`),
        );

        return { ...moduleDef, submodules, pages };
      })
      .filter((moduleDef) => moduleDef.submodules.length || moduleDef.pages.length);

    return ok(res, { modules: visible, isSuperAdmin: req.auth.isSuperAdmin });
  }),
);

module.exports = router;
