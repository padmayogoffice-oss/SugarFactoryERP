import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("materialIssue");
const schema = new mongoose.Schema({
  "issueNo": { type: String, required: [true, "Issue Number is required"], unique: true },
  "issueDate": { type: Date, required: [true, "Issue Date is required"] },
  "warehouse": { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: [true, "From Warehouse is required"] },
  "department": { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: [true, "To Department is required"] },
  "item": { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: [true, "Item is required"] },
  "quantity": { type: Number, required: [true, "Quantity is required"] },
  "uom": { type: String, required: [true, "UOM is required"] },
  "rate": { type: Number },
  "issuedTo": { type: String, required: [true, "Issued To is required"] },
  "costCenter": { type: mongoose.Schema.Types.ObjectId, ref: "CostCenter" },
  "status": { type: String, default: "draft" },
  "remarks": { type: String },
  "issuedToMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  "totalValue": { type: Number },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "issuedTo": 1 });
schema.index({ "remarks": 1 });

export const modelName = "MaterialIssue";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };