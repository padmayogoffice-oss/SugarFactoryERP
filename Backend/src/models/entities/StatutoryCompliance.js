import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("statutoryCompliance");
const schema = new mongoose.Schema({
  "entryNo": { type: String, required: [true, "Entry Number is required"], unique: true },
  "period": { type: String, required: [true, "Period is required"] },
  "complianceType": { type: String, required: [true, "Compliance Type is required"] },
  "employeeCount": { type: Number },
  "employeeContribution": { type: Number, default: 0 },
  "employerContribution": { type: Number, default: 0 },
  "challanNo": { type: String },
  "paidDate": { type: Date },
  "status": { type: String, default: "pending" },
  "remarks": { type: String },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "period": 1 });
schema.index({ "challanNo": 1 });
schema.index({ "remarks": 1 });

export const modelName = "StatutoryCompliance";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
