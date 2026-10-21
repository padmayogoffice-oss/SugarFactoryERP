import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("stockValuation");
const schema = new mongoose.Schema({
  "valuationNo": { type: String, required: [true, "Valuation Number is required"], unique: true },
  "valuationDate": { type: Date, required: [true, "Valuation Date is required"] },
  "warehouse": { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
  "item": { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: [true, "Item is required"] },
  "valuationMethod": { type: String, required: [true, "Method is required"] },
  "closingQty": { type: Number, required: [true, "Closing Quantity is required"] },
  "rate": { type: Number, required: [true, "Valuation Rate is required"] },
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

export const modelName = "StockValuation";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
