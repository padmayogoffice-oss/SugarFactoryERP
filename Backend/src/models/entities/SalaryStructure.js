import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("salaryStructure");
const schema = new mongoose.Schema({
  "code": { type: String, required: [true, "Structure Code is required"], unique: true },
  "employee": { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: [true, "Employee is required"] },
  "effectiveFrom": { type: Date, required: [true, "Effective From is required"] },
  "basic": { type: Number, required: [true, "Basic is required"] },
  "hraPercent": { type: Number, default: 20 },
  "daPercent": { type: Number, default: 15 },
  "specialAllowance": { type: Number, default: 0 },
  "conveyance": { type: Number, default: 0 },
  "pfPercent": { type: Number, default: 12 },
  "esiPercent": { type: Number, default: 0.75 },
  "professionalTax": { type: Number, default: 200 },
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

export const modelName = "SalaryStructure";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
