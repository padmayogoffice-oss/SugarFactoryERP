/**
 * Registry aggregator — the single source of truth for the whole application.
 *
 * Module definitions from `./modules/*` are concatenated and sorted once here.
 * From this list the backend derives Mongoose models, CRUD routers, the
 * permission catalogue and the navigation tree, and the frontend derives its
 * sidebar, router and generic list/form screens. Adding a submodule here is
 * therefore enough to make it appear end to end.
 */
import coreModules from './modules/core.js';
import operationsModules from './modules/operations.js';
import supplyModules from './modules/supply.js';
import commercialModules from './modules/commercial.js';
import peopleModules from './modules/people.js';
import mongoose from 'mongoose';
import { buildPermissionCatalog } from './helpers.js';
import { toClientSchema } from './fields.js';
import { applyExtensions, deriveRelations } from './relations.js';
import { applyNumbering } from './numbering.js';
import { applyDerived } from './derived.js';
import { interconnectionPlugin } from '../plugins/interconnectionPlugin.js';

const modules = [
  ...coreModules,
  ...operationsModules,
  ...supplyModules,
  ...commercialModules,
  ...peopleModules,
].sort((a, b) => a.order - b.order);

// Interconnection layers, applied once at startup (order matters): missing links
// first, then generated identifiers, persisted derived fields, and finally the
// relation rules (cascading filters / auto-fill) computed from the final fields.
applyExtensions(modules);
applyNumbering(modules);
applyDerived(modules);
deriveRelations(modules);

// Every entity model imports this registry before it compiles its schema, so the
// plugin is guaranteed to be registered in time for all of them.
mongoose.plugin(interconnectionPlugin);

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
      // Entity-level hints for forms (field metadata above is left untouched):
      // which field the server generates, and how selections relate to each other.
      autoNumberField: submodule.autoNumberField,
      relations: submodule.relations,
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

export { modules, permissionCatalog, getSubmodule, getModule, toClientTree, pagePermission };