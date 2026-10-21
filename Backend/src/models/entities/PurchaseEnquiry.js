import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("purchaseEnquiry");
const schema = new mongoose.Schema({
  "enquiryNo": { type: String, required: [true, "Enquiry No is required"], unique: true },
  "enquiryDate": { type: Date, required: [true, "Enquiry Date is required"] },
  "requisition": { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseRequisition" },
  "item": { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: [true, "Item is required"] },
  "quantity": { type: Number, required: [true, "Quantity is required"] },
  "uom": { type: String, required: [true, "UOM is required"] },
  "suppliers": { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
  "dueDate": { type: Date, required: [true, "Quotation Due Date is required"] },
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

export const modelName = "PurchaseEnquiry";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
