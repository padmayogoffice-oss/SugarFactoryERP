import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';
import { permissionCatalog, modules } from '../registry/index.js';

const listPermissions = asyncHandler(async (_req, res) => {
  const grouped = modules.map((moduleDef) => ({
    module: moduleDef.key,
    name: moduleDef.name,
    submodules: moduleDef.submodules.map((submodule) => ({
      key: submodule.key,
      name: submodule.name,
      permissions: submodule.actions.map((action) => `${moduleDef.key}:${submodule.key}:${action}`),
    })),
    pages: moduleDef.pages.map((page) => ({
      key: page.key,
      name: page.name,
      permissions: [`${moduleDef.key}:${page.key}:view`],
    })),
  }));

  return ok(res, { total: permissionCatalog.length, groups: grouped });
});

export { listPermissions };
