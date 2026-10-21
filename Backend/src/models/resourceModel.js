import { modules } from '../registry/index.js';
import { entityModels } from './entities/index.js';

function buildResourceModels() {
  const models = new Map();
  for (const moduleDef of modules) {
    for (const submodule of moduleDef.submodules) {
      const model = entityModels.get(submodule.key);
      if (!model) throw new Error(`Missing model for registry resource "${submodule.key}"`);
      models.set(submodule.key, { model, submodule, module: moduleDef, name: model.modelName });
    }
  }
  return models;
}

export { buildResourceModels };
