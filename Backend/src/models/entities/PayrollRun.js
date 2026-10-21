import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("payrollRun");
const schema = new mongoose.Schema({
  "runNo": { type: String, required: [true, "Run Number is required"], unique: true },
  "month": { type: String, required: [true, "Month is required"] },
  "year": { type: Number, required: [true, "Year is required"] },
  "employee": { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: [true, "Employee is required"] },
  "payableDays": { type: Number, required: [true, "Payable Days is required"] },
  "paymentMode": { type: String, default: "NEFT" },
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

export const modelName = "PayrollRun";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
