/**
 * Helpers used by the module registry.
 *
 * `mod()` and `sub()` keep the registry declarative: a submodule declares its
 * fields once, and the same declaration drives the Mongoose model, API
 * validation, and the frontend list/form pages.
 */

const DEFAULT_ACTIONS = ['view', 'create', 'update', 'delete'];

const SEARCHABLE_TYPES = new Set(['string', 'text', 'email', 'phone']);

function sub(key, name, fields, opts = {}) {
  return {
    key,
    name,
    description: opts.description || '',
    icon: opts.icon || 'file',
    fields,
    actions: opts.actions || DEFAULT_ACTIONS,
    searchable:
      opts.searchable ||
      fields.filter((field) => SEARCHABLE_TYPES.has(field.type)).map((field) => field.name),
    filterable: opts.filterable || fields.filter((field) => field.type === 'select').map((field) => field.name),
    defaultSort: opts.defaultSort || '-createdAt',
    labelField: opts.labelField || fields.find((field) => SEARCHABLE_TYPES.has(field.type))?.name || 'name',
    hidden: Boolean(opts.hidden),
  };
}

function mod(key, name, opts = {}) {
  return {
    key,
    name,
    description: opts.description || '',
    icon: opts.icon || 'grid',
    order: opts.order ?? 100,
    roles: opts.roles || [],
    submodules: opts.submodules || [],
    pages: opts.pages || [],
  };
}

/** Flattens the registry into the full permission catalog. */
function buildPermissionCatalog(modules) {
  const catalog = [];
  for (const moduleDef of modules) {
    for (const submodule of moduleDef.submodules) {
      for (const action of submodule.actions) {
        catalog.push({
          key: `${moduleDef.key}:${submodule.key}:${action}`,
          module: moduleDef.key,
          submodule: submodule.key,
          action,
          description: `${action} ${submodule.name} in ${moduleDef.name}`,
        });
      }
    }
    for (const page of moduleDef.pages) {
      catalog.push({
        key: `${moduleDef.key}:${page.key}:view`,
        module: moduleDef.key,
        submodule: page.key,
        action: 'view',
        description: `view ${page.name} in ${moduleDef.name}`,
      });
    }
  }
  return catalog;
}

export { DEFAULT_ACTIONS, sub, mod, buildPermissionCatalog };
