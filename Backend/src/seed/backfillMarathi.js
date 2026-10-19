/**
 * One-off, optional back-fill of Marathi companion fields for records that were
 * created before the transliteration feature existed.
 *
 *   npm run backfill:marathi                 # fill every module
 *   npm run backfill:marathi -- --dry-run    # report what would change, write nothing
 *   npm run backfill:marathi -- --only=farmer,department
 *
 * Safe by design: it only ever *sets* a `<field>Mr` value that is currently
 * empty/missing, never touches the English field, and never overwrites a Marathi
 * value that already exists (so manual corrections are preserved). It can be
 * re-run at any time.
 */
import mongoose from 'mongoose';
import connectDB from '../config/connectDB.js';
import '../models/User.js'; // hand-written models must be registered before the registry builds the rest
import '../models/Role.js';
import { buildResourceModels } from '../models/resourceModel.js';
import { transliterate } from '../services/transliterationService.js';

const BATCH_SIZE = 100;

/** Fills missing Marathi values for one model; returns { scanned, updated, failed } per field. */
async function backfillModel({ model, submodule, dryRun = false, convert = transliterate, log = () => {} }) {
  const summary = {};

  for (const field of submodule.fields.filter((item) => item.translit && item.marathiName)) {
    const stats = { scanned: 0, updated: 0, failed: 0 };
    summary[field.name] = stats;

    const filter = {
      [field.name]: { $type: 'string', $ne: '' },
      $or: [{ [field.marathiName]: { $exists: false } }, { [field.marathiName]: '' }, { [field.marathiName]: null }],
    };

    let operations = [];
    const flush = async () => {
      if (operations.length && !dryRun) await model.bulkWrite(operations, { ordered: false });
      operations = [];
    };

    for await (const doc of model.find(filter).select(`${field.name} ${field.marathiName}`).lean().cursor()) {
      stats.scanned += 1;
      try {
        const { text, source } = await convert(String(doc[field.name]));
        if (source === 'none' || !text) continue;
        operations.push({ updateOne: { filter: { _id: doc._id }, update: { $set: { [field.marathiName]: text } } } });
        stats.updated += 1;
        if (operations.length >= BATCH_SIZE) await flush();
      } catch (error) {
        stats.failed += 1;
        log(`  ! ${submodule.key}.${field.name} ${doc._id}: ${error.message}`);
      }
    }
    await flush();
  }

  return summary;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const onlyArg = args.find((arg) => arg.startsWith('--only='));
  const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').map((key) => key.trim())) : null;

  await connectDB();
  const resources = buildResourceModels();
  let totalUpdated = 0;
  let totalFailed = 0;

  for (const { model, submodule } of resources.values()) {
    if (only && !only.has(submodule.key)) continue;
    const summary = await backfillModel({ model, submodule, dryRun, log: console.warn });
    for (const [fieldName, stats] of Object.entries(summary)) {
      if (!stats.scanned) continue;
      console.log(`${submodule.key}.${fieldName}: scanned ${stats.scanned}, ${dryRun ? 'would update' : 'updated'} ${stats.updated}, failed ${stats.failed}`);
      totalUpdated += stats.updated;
      totalFailed += stats.failed;
    }
  }

  console.log(`${dryRun ? 'Dry run complete' : 'Done'}: ${totalUpdated} value(s) ${dryRun ? 'would be ' : ''}filled, ${totalFailed} failed.`);
  await mongoose.disconnect();
}

export { backfillModel };

// Run only when executed directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('backfillMarathi.js')) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
