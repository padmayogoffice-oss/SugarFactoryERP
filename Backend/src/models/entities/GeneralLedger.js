import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("generalLedger");
const schema = new mongoose.Schema({
  "entryNo": { type: String, required: [true, "Entry Number is required"], unique: true },
  "entryDate": { type: Date, required: [true, "Entry Date is required"] },
  "account": { type: mongoose.Schema.Types.ObjectId, ref: "ChartOfAccount", required: [true, "Account is required"] },
  "voucherType": { type: String, required: [true, "Voucher Type is required"] },
  "voucherNo": { type: String },
  "debitAmount": { type: Number, default: 0 },
  "creditAmount": { type: Number, default: 0 },
  "narration": { type: String },
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
schema.index({ "voucherNo": 1 });
schema.index({ "narration": 1 });
schema.index({ "remarks": 1 });

export const modelName = "GeneralLedger";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
