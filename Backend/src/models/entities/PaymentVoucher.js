import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("paymentVoucher");
const schema = new mongoose.Schema({
  "voucherNo": { type: String, required: [true, "Voucher Number is required"], unique: true },
  "voucherDate": { type: Date, required: [true, "Voucher Date is required"] },
  "paymentType": { type: String, required: [true, "Payment Type is required"] },
  "payeeType": { type: String, required: [true, "Payee Type is required"] },
  "supplier": { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
  "farmer": { type: mongoose.Schema.Types.ObjectId, ref: "Farmer" },
  "amount": { type: Number, required: [true, "Amount is required"] },
  "tdsAmount": { type: Number, default: 0 },
  "paymentMode": { type: String, required: [true, "Payment Mode is required"] },
  "bank": { type: mongoose.Schema.Types.ObjectId, ref: "Bank" },
  "instrumentNo": { type: String },
  "instrumentDate": { type: Date },
  "expenseAccount": { type: mongoose.Schema.Types.ObjectId, ref: "ChartOfAccount" },
  "status": { type: String, default: "draft" },
  "remarks": { type: String },
  "remarksMr": { type: String, trim: true, default: '' },
  "employee": { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  "purchaseOrder": { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder" },
  "goodsReceipt": { type: mongoose.Schema.Types.ObjectId, ref: "GoodsReceipt" },
  "canePayment": { type: mongoose.Schema.Types.ObjectId, ref: "CanePayment" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "instrumentNo": 1 });
schema.index({ "remarks": 1 });

export const modelName = "PaymentVoucher";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };