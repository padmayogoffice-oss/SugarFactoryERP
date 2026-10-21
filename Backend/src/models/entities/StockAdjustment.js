import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("stockAdjustment");
const schema = new mongoose.Schema({
  "adjustmentNo": { type: String, required: [true, "Adjustment Number is required"], unique: true },
  "adjustmentDate": { type: Date, required: [true, "Adjustment Date is required"] },
  "warehouse": { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: [true, "Warehouse is required"] },
  "item": { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: [true, "Item is required"] },
  "adjustmentType": { type: String, required: [true, "Adjustment Type is required"] },
  "quantity": { type: Number, required: [true, "Quantity is required"] },
  "rate": { type: Number },
  "reason": { type: String, required: [true, "Reason is required"] },
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
schema.index({ "approvedBy": 1 });
schema.index({ "remarks": 1 });

export const modelName = "StockAdjustment";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
