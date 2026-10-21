import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("purchaseRequisition");
const schema = new mongoose.Schema({
  "requisitionNo": { type: String, required: [true, "Requisition No is required"], unique: true },
  "requisitionDate": { type: Date, required: [true, "Requisition Date is required"] },
  "department": { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: [true, "Department is required"] },
  "requestedBy": { type: String, required: [true, "Requested By is required"] },
  "item": { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: [true, "Item is required"] },
  "quantity": { type: Number, required: [true, "Quantity is required"] },
  "uom": { type: String, required: [true, "UOM is required"] },
  "requiredByDate": { type: Date, required: [true, "Required By is required"] },
  "priority": { type: String, default: "Normal" },
  "estimatedRate": { type: Number },
  "justification": { type: String },
  "status": { type: String, default: "draft" },
  "remarks": { type: String },
  "requestedByMr": { type: String, trim: true, default: '' },
  "justificationMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "requestedBy": 1 });
schema.index({ "justification": 1 });
schema.index({ "remarks": 1 });

export const modelName = "PurchaseRequisition";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
