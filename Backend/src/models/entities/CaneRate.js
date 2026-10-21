import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("caneRate");
const schema = new mongoose.Schema({
  "rateCode": { type: String, required: [true, "Rate Code is required"], unique: true },
  "season": { type: String, required: [true, "Season is required"] },
  "rateType": { type: String, required: [true, "Rate Type is required"] },
  "baseRatePerMt": { type: Number, required: [true, "Base Rate is required"] },
  "recoveryLinked": { type: Boolean, default: false },
  "recoveryBasePercent": { type: Number },
  "ratePerRecoveryPoint": { type: Number },
  "effectiveFrom": { type: Date, required: [true, "Effective From is required"] },
  "effectiveTo": { type: Date },
  "status": { type: String, default: "active" },
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

export const modelName = "CaneRate";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
