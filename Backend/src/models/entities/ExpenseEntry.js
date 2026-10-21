import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("expenseEntry");
const schema = new mongoose.Schema({
  "expenseNo": { type: String, required: [true, "Expense Number is required"], unique: true },
  "expenseDate": { type: Date, required: [true, "Expense Date is required"] },
  "expenseHead": { type: String, required: [true, "Expense Head is required"] },
  "description": { type: String, required: [true, "Description is required"] },
  "amount": { type: Number, required: [true, "Amount is required"] },
  "gstAmount": { type: Number, default: 0 },
  "supplier": { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
  "department": { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  "costCenter": { type: mongoose.Schema.Types.ObjectId, ref: "CostCenter" },
  "status": { type: String, default: "draft" },
  "remarks": { type: String },
  "descriptionMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "description": 1 });
schema.index({ "remarks": 1 });

export const modelName = "ExpenseEntry";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
