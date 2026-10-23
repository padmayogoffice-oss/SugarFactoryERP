import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("plantDowntime");
const schema = new mongoose.Schema({
  "entryNo": { type: String, required: [true, "Entry Number is required"], unique: true },
  "stoppageDate": { type: Date, required: [true, "Stoppage Date is required"] },
  "shift": { type: String },
  "section": { type: String, required: [true, "Section is required"] },
  "reason": { type: String, required: [true, "Reason is required"] },
  "durationHours": { type: Number, required: [true, "Duration is required"] },
  "lossMt": { type: Number },
  "actionTaken": { type: String },
  "status": { type: String, default: "draft" },
  "remarks": { type: String },
  "actionTakenMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  "equipment": { type: mongoose.Schema.Types.ObjectId, ref: "Equipment" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "actionTaken": 1 });
schema.index({ "remarks": 1 });

export const modelName = "PlantDowntime";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };