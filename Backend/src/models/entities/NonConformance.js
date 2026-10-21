import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("nonConformance");
const schema = new mongoose.Schema({
  "ncNo": { type: String, required: [true, "NCR Number is required"], unique: true },
  "reportedDate": { type: Date, required: [true, "Reported Date is required"] },
  "source": { type: String, required: [true, "Source is required"] },
  "description": { type: String, required: [true, "Description is required"] },
  "severity": { type: String, required: [true, "Severity is required"] },
  "rootCause": { type: String },
  "correctiveAction": { type: String },
  "preventiveAction": { type: String },
  "responsiblePerson": { type: String },
  "targetDate": { type: Date },
  "status": { type: String, default: "open" },
  "remarks": { type: String },
  "descriptionMr": { type: String, trim: true, default: '' },
  "rootCauseMr": { type: String, trim: true, default: '' },
  "correctiveActionMr": { type: String, trim: true, default: '' },
  "preventiveActionMr": { type: String, trim: true, default: '' },
  "responsiblePersonMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "description": 1 });
schema.index({ "rootCause": 1 });
schema.index({ "correctiveAction": 1 });
schema.index({ "preventiveAction": 1 });
schema.index({ "responsiblePerson": 1 });
schema.index({ "remarks": 1 });

export const modelName = "NonConformance";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
