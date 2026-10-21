import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("physicalVerification");
const schema = new mongoose.Schema({
  "verificationNo": { type: String, required: [true, "Verification Number is required"], unique: true },
  "verificationDate": { type: Date, required: [true, "Verification Date is required"] },
  "warehouse": { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: [true, "Warehouse is required"] },
  "item": { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: [true, "Item is required"] },
  "bookQty": { type: Number, required: [true, "Book Quantity is required"] },
  "physicalQty": { type: Number, required: [true, "Physical Quantity is required"] },
  "verifiedBy": { type: String, required: [true, "Verified By is required"] },
  "status": { type: String, default: "draft" },
  "remarks": { type: String },
  "verifiedByMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "verifiedBy": 1 });
schema.index({ "remarks": 1 });

export const modelName = "PhysicalVerification";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
