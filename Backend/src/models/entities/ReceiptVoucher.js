import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("receiptVoucher");
const schema = new mongoose.Schema({
  "voucherNo": { type: String, required: [true, "Voucher Number is required"], unique: true },
  "voucherDate": { type: Date, required: [true, "Voucher Date is required"] },
  "receiptType": { type: String, required: [true, "Receipt Type is required"] },
  "customer": { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  "amount": { type: Number, required: [true, "Amount is required"] },
  "paymentMode": { type: String, required: [true, "Payment Mode is required"] },
  "bank": { type: mongoose.Schema.Types.ObjectId, ref: "Bank" },
  "instrumentNo": { type: String },
  "incomeAccount": { type: mongoose.Schema.Types.ObjectId, ref: "ChartOfAccount" },
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
schema.index({ "instrumentNo": 1 });
schema.index({ "remarks": 1 });

export const modelName = "ReceiptVoucher";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
