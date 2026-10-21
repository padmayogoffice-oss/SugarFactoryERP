import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("salesInvoice");
const schema = new mongoose.Schema({
  "invoiceNo": { type: String, required: [true, "Invoice Number is required"], unique: true },
  "invoiceDate": { type: Date, required: [true, "Invoice Date is required"] },
  "customer": { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: [true, "Customer is required"] },
  "salesOrder": { type: mongoose.Schema.Types.ObjectId, ref: "SalesOrder" },
  "dispatch": { type: mongoose.Schema.Types.ObjectId, ref: "Dispatch" },
  "grade": { type: String, required: [true, "Grade is required"] },
  "quantityMt": { type: Number, required: [true, "Quantity is required"] },
  "rate": { type: Number, required: [true, "Rate is required"] },
  "discountAmount": { type: Number, default: 0 },
  "freightAmount": { type: Number, default: 0 },
  "dueDate": { type: Date },
  "paymentStatus": { type: String, default: "unpaid" },
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

export const modelName = "SalesInvoice";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
