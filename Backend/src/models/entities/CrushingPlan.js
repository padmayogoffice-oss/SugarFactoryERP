import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("crushingPlan");
const schema = new mongoose.Schema({
  "planNo": { type: String, required: [true, "Plan Number is required"], unique: true },
  "season": { type: String, required: [true, "Season is required"] },
  "planDate": { type: Date, required: [true, "Plan Date is required"] },
  "plannedCrushingMt": { type: Number, required: [true, "Planned Crushing is required"] },
  "plannedRecoveryPercent": { type: Number },
  "crushingDays": { type: Number },
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

export const modelName = "CrushingPlan";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
