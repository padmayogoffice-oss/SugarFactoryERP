import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("budget");
const schema = new mongoose.Schema({
  "budgetNo": { type: String, required: [true, "Budget Number is required"], unique: true },
  "financialYear": { type: String, required: [true, "Financial Year is required"] },
  "costCenter": { type: mongoose.Schema.Types.ObjectId, ref: "CostCenter", required: [true, "Cost Center is required"] },
  "account": { type: mongoose.Schema.Types.ObjectId, ref: "ChartOfAccount" },
  "budgetAmount": { type: Number, required: [true, "Budget Amount is required"] },
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

export const modelName = "Budget";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
