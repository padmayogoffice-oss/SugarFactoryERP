import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("harvestingSchedule");
const schema = new mongoose.Schema({
  "scheduleNo": { type: String, required: [true, "Schedule Number is required"], unique: true },
  "scheduleDate": { type: Date, required: [true, "Schedule Date is required"] },
  "village": { type: String, required: [true, "Village is required"] },
  "season": { type: String, required: [true, "Season is required"] },
  "plannedQtyMt": { type: Number },
  "harvestingContractor": { type: String },
  "labourGroup": { type: String },
  "cutterCount": { type: Number },
  "status": { type: String, default: "planned" },
  "remarks": { type: String },
  "villageMr": { type: String, trim: true, default: '' },
  "harvestingContractorMr": { type: String, trim: true, default: '' },
  "labourGroupMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "village": 1 });
schema.index({ "harvestingContractor": 1 });
schema.index({ "labourGroup": 1 });
schema.index({ "remarks": 1 });

export const modelName = "HarvestingSchedule";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
