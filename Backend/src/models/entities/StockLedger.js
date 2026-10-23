import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("stockLedger");
const schema = new mongoose.Schema({
  "entryNo": { type: String, required: [true, "Entry Number is required"], unique: true },
  "entryDate": { type: Date, required: [true, "Entry Date is required"] },
  "item": { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: [true, "Item is required"] },
  "warehouse": { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: [true, "Warehouse is required"] },
  "transactionType": { type: String, required: [true, "Transaction Type is required"] },
  "referenceNo": { type: String },
  "inQty": { type: Number, default: 0 },
  "outQty": { type: Number, default: 0 },
  "rate": { type: Number },
  "remarks": { type: String },
  "remarksMr": { type: String, trim: true, default: '' },
  "value": { type: Number },
  "sourceModel": { type: String, index: true },
  "sourceId": { type: mongoose.Schema.Types.ObjectId, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "referenceNo": 1 });
schema.index({ "remarks": 1 });

export const modelName = "StockLedger";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };