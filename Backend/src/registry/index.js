/**
 * Registry aggregator — the single source of truth for the whole application.
 *
 * Module definitions from `./modules/*` are concatenated and sorted once here.
 * From this list the backend derives Mongoose models, CRUD routers, the
 * permission catalogue and the navigation tree, and the frontend derives its
 * sidebar, router and generic list/form screens. Adding a submodule here is
 * therefore enough to make it appear end to end.
 */
const coreModules = require('./modules/core');
const operationsModules = require('./modules/operations');
const supplyModules = require('./modules/supply');
const commercialModules = require('./modules/commercial');
const peopleModules = require('./modules/people');
const { buildPermissionCatalog } = require('./helpers');
const { toClientSchema } = require('./fields');

const modules = [
  ...coreModules,
  ...operationsModules,
  ...supplyModules,
  ...commercialModules,
  ...peopleModules,
].sort((a, b) => a.order - b.order);

const permissionCatalog = buildPermissionCatalog(modules);

/** Map of submodule key -> { module, submodule } for quick lookups. */
const submoduleIndex = new Map();
for (const moduleDef of modules) {
  for (const submodule of moduleDef.submodules) {
    // Keys double as URL segments, model names and permission prefixes, so a
    // collision would silently route two resources to one model.
    if (submoduleIndex.has(submodule.key)) {
      throw new Error(`Duplicate submodule key "${submodule.key}" found in module registry`);
    }
    submoduleIndex.set(submodule.key, { module: moduleDef, submodule });
  }
}

function getSubmodule(key) {
  return submoduleIndex.get(key);
}

function getModule(key) {
  return modules.find((moduleDef) => moduleDef.key === key);
}

/** Permissions required to view a module's page. */
function pagePermission(moduleKey, pageKey) {
  return `${moduleKey}:${pageKey}:view`;
}

/** Full client-facing module tree: modules -> submodules -> pages, with field schemas. */
function toClientTree() {
  return modules.map((moduleDef) => ({
    key: moduleDef.key,
    name: moduleDef.name,
    description: moduleDef.description,
    icon: moduleDef.icon,
    order: moduleDef.order,
    submodules: moduleDef.submodules.map((submodule) => ({
      key: submodule.key,
      name: submodule.name,
      description: submodule.description,
      icon: submodule.icon,
      actions: submodule.actions,
      labelField: submodule.labelField,
      searchable: submodule.searchable,
      filterable: submodule.filterable,
      fields: toClientSchema(submodule.fields),
    })),
    pages: moduleDef.pages.map((page) => ({
      key: page.key,
      name: page.name,
      description: page.description,
      icon: page.icon,
      permission: pagePermission(moduleDef.key, page.key),
    })),
  }));
}

module.exports = { modules, permissionCatalog, getSubmodule, getModule, toClientTree, pagePermission };
