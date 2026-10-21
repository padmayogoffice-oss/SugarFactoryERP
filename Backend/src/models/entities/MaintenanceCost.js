import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("maintenanceCost");
const schema = new mongoose.Schema({
  "entryNo": { type: String, required: [true, "Entry Number is required"], unique: true },
  "entryDate": { type: Date, required: [true, "Entry Date is required"] },
  "equipment": { type: mongoose.Schema.Types.ObjectId, ref: "Equipment", required: [true, "Equipment is required"] },
  "costHead": { type: String, required: [true, "Cost Head is required"] },
  "amount": { type: Number, required: [true, "Amount is required"] },
  "costCenter": { type: mongoose.Schema.Types.ObjectId, ref: "CostCenter" },
  "vendor": { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
  "invoiceNo": { type: String },
  "remarks": { type: String },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "invoiceNo": 1 });
schema.index({ "remarks": 1 });

export const modelName = "MaintenanceCost";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
