/**
 * Registry-driven demo data. Walks the registry and generates a handful of
 * plausible records per submodule, resolving reference fields to already-seeded
 * documents so the UI has linked data to display.
 */
import { modules } from '../registry/index.js';
import { setReferenceValidation } from '../plugins/interconnectionPlugin.js';

/**
 * Generates a realistic value for a field definition so seeded records exercise
 * every column type, select option and reference.
 */
function valueFor(field, index) {
  const n = index + 1;

  switch (field.type) {
    case 'email':
      return `${field.name}${n}@example.com`;
    case 'phone':
      return `9${String(800000000 + n).slice(0, 9)}`;
    case 'number':
      return Number((10 + n * 3.5).toFixed(2));
    case 'decimal':
      return Number((1 + (n % 7) * 0.5).toFixed(2));
    case 'currency':
      return Number((1000 + n * 137.5).toFixed(2));
    case 'percent':
      return field.options ? field.options[n % field.options.length] : Number((5 + (n % 20)).toFixed(2));
    case 'date': {
      const date = new Date();
      date.setDate(date.getDate() - (n % 45));
      return date;
    }
    case 'boolean':
      return field.default !== undefined ? field.default : n % 2 === 0;
    case 'select':
      return field.options ? field.options[n % field.options.length] : 'Other';
    case 'multiselect':
    case 'tags':
      return field.options ? [field.options[n % field.options.length]] : [`tag-${n}`];
    default:
      if (field.options) return field.options[n % field.options.length];
      if (field.name === 'code' || field.name.endsWith('No') || field.name.endsWith('Code')) {
        return `${field.name.toUpperCase().slice(0, 4)}-${String(1000 + n)}`;
      }
      return `${field.label} ${n}`;
  }
}

/**
 * Seeds demo data for every submodule.
 *
 * Submodules are processed in registry order and reference fields are resolved
 * immediately from records already created, which matches the dependency order
 * declared in the registry. Self references are backfilled after insert.
 */
async function seedDemoDataUnchecked(resources, { recordsPerSubmodule = 4 } = {}) {
  const created = new Map();
  const pendingSelfRefs = [];
  const byModelName = new Map([...resources.values()].map((entry) => [entry.name, entry]));

  for (const moduleDef of modules) {
    if (moduleDef.key === 'access') continue;

    for (const submodule of moduleDef.submodules) {
      const entry = resources.get(submodule.key);
      if (!entry) continue;

      const existingCount = await entry.model.estimatedDocumentCount();
      if (existingCount > 0) {
        created.set(submodule.key, await entry.model.find().select('_id').limit(recordsPerSubmodule).lean());
        continue;
      }

      const docs = [];

      for (let index = 0; index < recordsPerSubmodule; index += 1) {
        const doc = {};

        for (const field of submodule.fields) {
          if (field.readOnly) continue;

          if (field.type === 'ref') {
            if (field.ref === entry.name) {
              pendingSelfRefs.push({ submoduleKey: submodule.key, field: field.name, index });
              continue;
            }

            const target = byModelName.get(field.ref);
            const pool = target ? created.get(target.submodule.key) : null;

            if (pool && pool.length) {
              doc[field.name] = pool[index % pool.length]._id;
              continue;
            }
            if (field.required) {
              throw new Error(
                `Cannot seed ${submodule.key}.${field.name}: no ${field.ref} records exist yet. Check registry ordering.`,
              );
            }
            continue;
          }

          doc[field.name] = valueFor(field, index);
        }

        docs.push(doc);
      }

      const inserted = await entry.model.insertMany(docs);
      created.set(submodule.key, inserted.map((doc) => ({ _id: doc._id })));
    }
  }

  for (const pending of pendingSelfRefs) {
    const entry = resources.get(pending.submoduleKey);
    const pool = created.get(pending.submoduleKey) || [];
    if (!entry || pool.length < 2) continue;

    await entry.model.updateOne(
      { _id: pool[pending.index]._id },
      { $set: { [pending.field]: pool[(pending.index + 1) % pool.length]._id } },
    );
  }

  return created;
}

/**
 * Demo records are generated at random (statuses cycle through every option, links
 * are picked round-robin), so they are inserted without reference validation. They
 * still receive generated numbers and stored totals.
 */
async function seedDemoData(resources, options) {
  setReferenceValidation(false);
  try {
    return await seedDemoDataUnchecked(resources, options);
  } finally {
    setReferenceValidation(true);
  }
}

export { seedDemoData };