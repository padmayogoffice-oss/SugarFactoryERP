import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("byProduct");
const schema = new mongoose.Schema({
  "entryNo": { type: String, required: [true, "Entry Number is required"], unique: true },
  "entryDate": { type: Date, required: [true, "Entry Date is required"] },
  "shift": { type: String },
  "productType": { type: String, required: [true, "By-Product is required"] },
  "quantityMt": { type: Number, required: [true, "Quantity is required"] },
  "warehouse": { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
  "qualityGrade": { type: String },
  "status": { type: String, default: "draft" },
  "remarks": { type: String },
  "remarksMr": { type: String, trim: true, default: '' },
  "item": { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "remarks": 1 });

export const modelName = "ByProduct";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };