import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("preventiveMaintenance");
const schema = new mongoose.Schema({
  "scheduleNo": { type: String, required: [true, "Schedule Number is required"], unique: true },
  "equipment": { type: mongoose.Schema.Types.ObjectId, ref: "Equipment", required: [true, "Equipment is required"] },
  "maintenanceType": { type: String, required: [true, "Maintenance Type is required"] },
  "plannedDate": { type: Date, required: [true, "Planned Date is required"] },
  "actualDate": { type: Date },
  "assignedTo": { type: String, required: [true, "Assigned To is required"] },
  "checklist": { type: String },
  "estimatedHours": { type: Number },
  "status": { type: String, default: "scheduled" },
  "remarks": { type: String },
  "assignedToMr": { type: String, trim: true, default: '' },
  "checklistMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "assignedTo": 1 });
schema.index({ "checklist": 1 });
schema.index({ "remarks": 1 });

export const modelName = "PreventiveMaintenance";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
