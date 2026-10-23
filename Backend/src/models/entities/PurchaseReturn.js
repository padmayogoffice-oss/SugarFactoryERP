import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("purchaseReturn");
const schema = new mongoose.Schema({
  "returnNo": { type: String, required: [true, "Return Number is required"], unique: true },
  "returnDate": { type: Date, required: [true, "Return Date is required"] },
  "supplier": { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: [true, "Vendor is required"] },
  "goodsReceipt": { type: mongoose.Schema.Types.ObjectId, ref: "GoodsReceipt" },
  "item": { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: [true, "Item is required"] },
  "quantity": { type: Number, required: [true, "Returned Qty is required"] },
  "uom": { type: String, required: [true, "UOM is required"] },
  "rate": { type: Number },
  "reason": { type: String, required: [true, "Reason is required"] },
  "debitNoteNo": { type: String },
  "status": { type: String, default: "draft" },
  "remarks": { type: String },
  "remarksMr": { type: String, trim: true, default: '' },
  "totalAmount": { type: Number },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "debitNoteNo": 1 });
schema.index({ "remarks": 1 });

export const modelName = "PurchaseReturn";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };