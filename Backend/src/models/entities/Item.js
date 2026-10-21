import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("item");
const schema = new mongoose.Schema({
  "code": { type: String, required: [true, "Item Code is required"], unique: true },
  "name": { type: String, required: [true, "Item Name is required"] },
  "category": { type: String, required: [true, "Category is required"] },
  "uom": { type: String, required: [true, "Unit of Measure is required"] },
  "hsnCode": { type: String },
  "gstRate": { type: Number, default: 18 },
  "reorderLevel": { type: Number },
  "openingStock": { type: Number, default: 0 },
  "openingRate": { type: Number, default: 0 },
  "isStocked": { type: Boolean, default: true },
  "status": { type: String, default: "active" },
  "remarks": { type: String },
  "nameMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "name": 1 });
schema.index({ "hsnCode": 1 });
schema.index({ "remarks": 1 });

export const modelName = "Item";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
