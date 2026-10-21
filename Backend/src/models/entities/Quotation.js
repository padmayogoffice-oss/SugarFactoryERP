import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("quotation");
const schema = new mongoose.Schema({
  "quotationNo": { type: String, required: [true, "Quotation No is required"], unique: true },
  "quotationDate": { type: Date, required: [true, "Quotation Date is required"] },
  "enquiry": { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseEnquiry" },
  "supplier": { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: [true, "Vendor is required"] },
  "item": { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: [true, "Item is required"] },
  "quantity": { type: Number, required: [true, "Quantity is required"] },
  "rate": { type: Number, required: [true, "Quoted Rate is required"] },
  "discountPercent": { type: Number, default: 0 },
  "taxPercent": { type: Number, default: 18 },
  "freightAmount": { type: Number, default: 0 },
  "deliveryDays": { type: Number },
  "paymentTerms": { type: String },
  "isSelected": { type: Boolean, default: false },
  "status": { type: String, default: "received" },
  "remarks": { type: String },
  "paymentTermsMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "paymentTerms": 1 });
schema.index({ "remarks": 1 });

export const modelName = "Quotation";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
