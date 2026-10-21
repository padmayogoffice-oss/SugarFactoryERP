import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("powerGeneration");
const schema = new mongoose.Schema({
  "entryNo": { type: String, required: [true, "Entry Number is required"], unique: true },
  "entryDate": { type: Date, required: [true, "Entry Date is required"] },
  "shift": { type: String },
  "generatedKwh": { type: Number, required: [true, "Units Generated is required"] },
  "exportedKwh": { type: Number },
  "bagasseConsumedMt": { type: Number },
  "boilerEfficiencyPercent": { type: Number },
  "status": { type: String, default: "draft" },
  "remarks": { type: String },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "remarks": 1 });

export const modelName = "PowerGeneration";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
