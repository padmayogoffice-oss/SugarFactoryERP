import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("journalVoucher");
const schema = new mongoose.Schema({
  "voucherNo": { type: String, required: [true, "Voucher Number is required"], unique: true },
  "voucherDate": { type: Date, required: [true, "Voucher Date is required"] },
  "voucherType": { type: String, required: [true, "Voucher Type is required"] },
  "debitAccount": { type: mongoose.Schema.Types.ObjectId, ref: "ChartOfAccount", required: [true, "Debit Account is required"] },
  "creditAccount": { type: mongoose.Schema.Types.ObjectId, ref: "ChartOfAccount", required: [true, "Credit Account is required"] },
  "amount": { type: Number, required: [true, "Amount is required"] },
  "narration": { type: String },
  "costCenter": { type: mongoose.Schema.Types.ObjectId, ref: "CostCenter" },
  "status": { type: String, default: "draft" },
  "remarks": { type: String },
  "narrationMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "narration": 1 });
schema.index({ "remarks": 1 });

export const modelName = "JournalVoucher";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
