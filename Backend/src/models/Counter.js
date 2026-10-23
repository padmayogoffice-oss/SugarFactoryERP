/**
 * Atomic sequence counters used to generate business identifiers (PO numbers,
 * farmer codes, ...). One document per sequence; `$inc` on a single document is
 * atomic in MongoDB, so concurrent requests can never receive the same number.
 */
import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema(
  {
    // e.g. "purchaseOrder:2526" (sequence key + financial year) or "farmer:all"
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false, timestamps: true },
);

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

export default Counter;