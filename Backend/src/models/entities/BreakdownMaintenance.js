import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("breakdownMaintenance");
const schema = new mongoose.Schema({
  "ticketNo": { type: String, required: [true, "Ticket Number is required"], unique: true },
  "reportedAt": { type: Date, required: [true, "Reported At is required"] },
  "equipment": { type: mongoose.Schema.Types.ObjectId, ref: "Equipment", required: [true, "Equipment is required"] },
  "reportedBy": { type: String, required: [true, "Reported By is required"] },
  "breakdownType": { type: String, required: [true, "Breakdown Type is required"] },
  "description": { type: String, required: [true, "Problem Description is required"] },
  "attendedBy": { type: String },
  "attendedAt": { type: Date },
  "resolvedAt": { type: Date },
  "actionTaken": { type: String },
  "status": { type: String, default: "open" },
  "remarks": { type: String },
  "reportedByMr": { type: String, trim: true, default: '' },
  "descriptionMr": { type: String, trim: true, default: '' },
  "attendedByMr": { type: String, trim: true, default: '' },
  "actionTakenMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "reportedBy": 1 });
schema.index({ "description": 1 });
schema.index({ "attendedBy": 1 });
schema.index({ "actionTaken": 1 });
schema.index({ "remarks": 1 });

export const modelName = "BreakdownMaintenance";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
