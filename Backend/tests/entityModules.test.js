import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { modules } from '../src/registry/index.js';
import { toClientSchema } from '../src/registry/fields.js';
import { buildResourceModels } from '../src/models/resourceModel.js';
import { entityControllers } from '../src/controllers/entities/index.js';
import { entityRoutes } from '../src/routes/entities/index.js';
import { buildApiRouter } from '../src/routes/index.js';

const registryResources = modules.flatMap((module) =>
  module.submodules.map((submodule) => ({ module, submodule })),
);

test('every registry entity has a model and every CRUD entity has direct handlers', () => {
  const models = buildResourceModels();
  const genericResources = registryResources.filter(({ module }) => module.key !== 'access');

  assert.equal(models.size, registryResources.length);
  assert.equal(entityControllers.size, genericResources.length);

  for (const { submodule } of registryResources) {
    const resource = models.get(submodule.key);
    assert.ok(resource, `${submodule.key} model is registered`);
    assert.equal(resource.model.modelName, submodule.key[0].toUpperCase() + submodule.key.slice(1));
    for (const field of submodule.fields) {
      if (field.readOnly) continue;
      const schemaPath = resource.model.schema.path(field.name);
      assert.ok(schemaPath, `${submodule.key}.${field.name} is present in the model schema`);
      if (field.required) assert.equal(schemaPath.isRequired, true, `${submodule.key}.${field.name} keeps required validation`);
      if (field.unique) assert.equal(schemaPath.options.unique, true, `${submodule.key}.${field.name} keeps its unique index`);
    }
  }
  for (const { submodule } of genericResources) {
    assert.ok(entityControllers.has(submodule.key), `${submodule.key} controller is registered`);
    assert.equal(typeof entityControllers.get(submodule.key).list, 'function');
    assert.equal(typeof entityControllers.get(submodule.key).create, 'function');

    const modelName = submodule.key[0].toUpperCase() + submodule.key.slice(1);
    const modelSource = readFileSync(new URL(`../src/models/entities/${modelName}.js`, import.meta.url), 'utf8');
    const controllerSource = readFileSync(new URL(`../src/controllers/entities/${submodule.key}Controller.js`, import.meta.url), 'utf8');
    assert.match(modelSource, /new mongoose\.Schema\(/, `${submodule.key} declares its schema directly`);
    assert.doesNotMatch(modelSource, /buildResourceModel/, `${submodule.key} does not use a model factory`);
    assert.match(controllerSource, /export const list\s*=/, `${submodule.key} declares its list handler directly`);
    assert.match(controllerSource, /export const create\s*=/, `${submodule.key} declares its create handler directly`);
    assert.doesNotMatch(controllerSource, /createResourceController/, `${submodule.key} does not use a controller factory`);
  }
});

test('every generated CRUD entity has one dedicated route module', () => {
  const genericResources = registryResources.filter(({ module }) => module.key !== 'access');

  assert.equal(entityRoutes.size, genericResources.length);
  for (const { submodule } of genericResources) {
    assert.ok(entityRoutes.has(submodule.key), `${submodule.key} route is registered`);
    const routeSource = readFileSync(new URL(`../src/routes/entities/${submodule.key}Routes.js`, import.meta.url), 'utf8');
    assert.match(routeSource, /router\.get\('\//, `${submodule.key} declares its routes directly`);
    assert.doesNotMatch(routeSource, /createResourceRouter/, `${submodule.key} does not use a route factory`);
  }

  assert.doesNotThrow(() => buildApiRouter());
});

test('every frontend entity page owns matching field definitions and CRUD flows', () => {
  for (const { module, submodule } of registryResources.filter(({ module }) => module.key !== 'access')) {
    const pageName = submodule.key[0].toUpperCase() + submodule.key.slice(1) + 'Page.jsx';
    const pageSource = readFileSync(
      new URL(`../../Frontend/src/pages/entities/${module.key}/${pageName}`, import.meta.url),
      'utf8',
    );
    const fieldsDeclaration = pageSource.match(/const fields =\s*(\[[\s\S]*?\])\n\nexport default function/);

    assert.ok(fieldsDeclaration, `${module.key}/${pageName} declares fields directly`);
    assert.deepEqual(
      JSON.parse(fieldsDeclaration[1]),
      JSON.parse(JSON.stringify(toClientSchema(submodule.fields))),
    );
    assert.match(pageSource, /async function handleSubmit/);
    assert.match(pageSource, /async function handleDelete/);
    assert.doesNotMatch(pageSource, /ResourcePage|ResourceForm/);
  }
});
