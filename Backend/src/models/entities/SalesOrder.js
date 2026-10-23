import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("salesOrder");
const schema = new mongoose.Schema({
  "orderNo": { type: String, required: [true, "Order Number is required"], unique: true },
  "orderDate": { type: Date, required: [true, "Order Date is required"] },
  "customer": { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: [true, "Customer is required"] },
  "product": { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: [true, "Product is required"] },
  "grade": { type: String, required: [true, "Grade is required"] },
  "quantityMt": { type: Number, required: [true, "Order Quantity is required"] },
  "rate": { type: Number, required: [true, "Rate is required"] },
  "discountPercent": { type: Number, default: 0 },
  "taxPercent": { type: Number, default: 5 },
  "deliveryDate": { type: Date },
  "paymentTerm": { type: mongoose.Schema.Types.ObjectId, ref: "PaymentTerm" },
  "deliveryAddress": { type: String },
  "status": { type: String, default: "draft" },
  "remarks": { type: String },
  "deliveryAddressMr": { type: String, trim: true, default: '' },
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
schema.index({ "deliveryAddress": 1 });
schema.index({ "remarks": 1 });

export const modelName = "SalesOrder";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };