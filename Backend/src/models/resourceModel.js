const mongoose = require('mongoose');
const { toMongooseType } = require('../registry/fields');
const { modules } = require('../registry');

/** camelCase submodule key -> PascalCase model name (matches registry `ref` values). */
function modelNameFor(submoduleKey) {
  return submoduleKey.charAt(0).toUpperCase() + submoduleKey.slice(1);
}

function buildSchema(submodule) {
  const definition = {};

  for (const field of submodule.fields) {
    if (field.readOnly) continue;
    definition[field.name] = toMongooseType(field);
  }

  definition.createdBy = { type: mongoose.Schema.Types.ObjectId, ref: 'User' };
  definition.updatedBy = { type: mongoose.Schema.Types.ObjectId, ref: 'User' };

  const schema = new mongoose.Schema(definition, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  });

  // `unique` fields already have an index; adding another would be a duplicate.
  const uniqueFields = new Set(submodule.fields.filter((field) => field.unique).map((field) => field.name));
  for (const field of submodule.searchable) {
    if (uniqueFields.has(field)) continue;
    schema.index({ [field]: 1 });
  }

  return schema;
}

/**
 * Builds (or reuses) a Mongoose model for every submodule that does not already
 * have a hand written model. Models are keyed by their registry `ref` name so
 * `populate()` works across modules.
 */
function buildResourceModels() {
  const models = new Map();

  for (const moduleDef of modules) {
    for (const submodule of moduleDef.submodules) {
      const name = modelNameFor(submodule.key);

      if (mongoose.models[name]) {
        models.set(submodule.key, { model: mongoose.models[name], submodule, module: moduleDef, name });
        continue;
      }

      const schema = buildSchema(submodule);
      const model = mongoose.model(name, schema);
      models.set(submodule.key, { model, submodule, module: moduleDef, name });
    }
  }

  return models;
}

module.exports = { buildResourceModels, modelNameFor };
