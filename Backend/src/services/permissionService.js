/**
 * Permission resolution and checks. A permission is the three-part key
 * `module:submodule:action`; either segment may be `*`, and the bare `*` grants
 * everything. Wildcards are resolved here rather than stored expanded, so a role
 * holding `stores:*:view` keeps working when new stores submodules are added.
 */
const Role = require('../models/Role');

const WILDCARD = '*';

/**
 * Resolves the effective permission set for a user from the roles assigned to
 * them. Super admins implicitly hold every permission.
 */
async function resolvePermissions(user) {
  if (user.isSuperAdmin) {
    return { permissions: [WILDCARD], roles: [], isSuperAdmin: true };
  }

  const roles = await Role.find({ _id: { $in: user.roles || [] }, status: 'active' }).lean();
  const permissions = new Set();

  for (const role of roles) {
    for (const permission of role.permissions || []) {
      permissions.add(permission);
    }
  }

  return {
    permissions: [...permissions],
    roles: roles.map((role) => ({ id: String(role._id), code: role.code, name: role.name })),
    isSuperAdmin: false,
  };
}

function hasPermission(permissions, required) {
  if (!permissions || !permissions.length) return false;
  if (permissions.includes(WILDCARD)) return true;

  const [moduleKey, submoduleKey, action] = required.split(':');

  return permissions.some((granted) => {
    const [grantedModule, grantedSubmodule, grantedAction] = granted.split(':');
    if (grantedModule !== moduleKey) return false;
    if (grantedSubmodule !== submoduleKey && grantedSubmodule !== '*') return false;
    if (grantedAction !== action && grantedAction !== '*') return false;
    return true;
  });
}

/** True when the user may perform any action on the submodule. */
function hasSubmoduleAccess(permissions, moduleKey, submoduleKey) {
  if (!permissions || !permissions.length) return false;
  if (permissions.includes(WILDCARD)) return true;
  return permissions.some((granted) => {
    const [grantedModule, grantedSubmodule] = granted.split(':');
    return grantedModule === moduleKey && (grantedSubmodule === submoduleKey || grantedSubmodule === '*');
  });
}

module.exports = { resolvePermissions, hasPermission, hasSubmoduleAccess, WILDCARD };
