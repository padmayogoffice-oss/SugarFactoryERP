import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("customerReceipt");
const schema = new mongoose.Schema({
  "receiptNo": { type: String, required: [true, "Receipt Number is required"], unique: true },
  "receiptDate": { type: Date, required: [true, "Receipt Date is required"] },
  "customer": { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: [true, "Customer is required"] },
  "invoice": { type: mongoose.Schema.Types.ObjectId, ref: "SalesInvoice" },
  "amount": { type: Number, required: [true, "Amount Received is required"] },
  "tdsAmount": { type: Number, default: 0 },
  "paymentMode": { type: String, required: [true, "Payment Mode is required"] },
  "instrumentNo": { type: String },
  "instrumentDate": { type: Date },
  "bank": { type: mongoose.Schema.Types.ObjectId, ref: "Bank" },
  "status": { type: String, default: "received" },
  "remarks": { type: String },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "instrumentNo": 1 });
schema.index({ "remarks": 1 });

export const modelName = "CustomerReceipt";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
