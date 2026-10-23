/**
 * Computes and stores derived values (PO totals, GRN value, stock value, ...) for
 * records that were saved before they were persisted, so reports and dashboards
 * that sum them include old data. Safe to run repeatedly; it only writes derived
 * fields and never touches identifiers, references or stock postings.
 *
 *   npm run backfill:derived
 */
import mongoose from 'mongoose';
import connectDB from '../config/connectDB.js';
import '../models/User.js'; // hand-written models must be registered before the registry builds the rest
import '../models/Role.js';
import { buildResourceModels } from '../models/resourceModel.js';
import { DERIVE, deriveValues, snapshotValues } from '../registry/derived.js';

async function run() {
  await connectDB();
  const resources = buildResourceModels();
  const keys = [...new Set([...Object.keys(DERIVE), 'goodsReceipt'])];

  for (const key of keys) {
    const entry = resources.get(key);
    if (!entry) continue;
    const operations = [];
    for await (const doc of entry.model.find().lean().cursor()) {
      const values = {
        ...deriveValues(key, doc),
        ...(await snapshotValues(key, doc, (name, id, select) => mongoose.models[name]?.findById(id).select(select).lean())),
      };
      if (Object.keys(values).length) operations.push({ updateOne: { filter: { _id: doc._id }, update: { $set: values } } });
      if (operations.length >= 500) {
        await entry.model.bulkWrite(operations.splice(0), { timestamps: false });
      }
    }
    if (operations.length) await entry.model.bulkWrite(operations, { timestamps: false });
    console.log(`${key}: derived values stored`);
  }
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});