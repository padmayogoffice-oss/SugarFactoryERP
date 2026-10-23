import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("purchaseOrder");
const schema = new mongoose.Schema({
  "poNo": { type: String, required: [true, "PO Number is required"], unique: true },
  "poDate": { type: Date, required: [true, "PO Date is required"] },
  "supplier": { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: [true, "Vendor is required"] },
  "quotation": { type: mongoose.Schema.Types.ObjectId, ref: "Quotation" },
  "item": { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: [true, "Item is required"] },
  "quantity": { type: Number, required: [true, "Quantity is required"] },
  "uom": { type: String, required: [true, "UOM is required"] },
  "rate": { type: Number, required: [true, "Rate is required"] },
  "discountPercent": { type: Number, default: 0 },
  "taxPercent": { type: Number, default: 18 },
  "freightAmount": { type: Number, default: 0 },
  "deliveryDate": { type: Date, required: [true, "Expected Delivery is required"] },
  "paymentTerm": { type: mongoose.Schema.Types.ObjectId, ref: "PaymentTerm" },
  "warehouse": { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
  "status": { type: String, default: "draft" },
  "remarks": { type: String },
  "remarksMr": { type: String, trim: true, default: '' },
  "subTotal": { type: Number },
  "taxAmount": { type: Number },
  "totalAmount": { type: Number },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "remarks": 1 });

export const modelName = "PurchaseOrder";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };