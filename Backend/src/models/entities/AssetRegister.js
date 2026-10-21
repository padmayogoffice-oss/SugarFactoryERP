import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("assetRegister");
const schema = new mongoose.Schema({
  "assetCode": { type: String, required: [true, "Asset Code is required"], unique: true },
  "name": { type: String, required: [true, "Asset Name is required"] },
  "category": { type: String, required: [true, "Category is required"] },
  "purchaseDate": { type: Date, required: [true, "Purchase Date is required"] },
  "purchaseValue": { type: Number, required: [true, "Purchase Value is required"] },
  "depreciationRate": { type: Number, default: 10 },
  "location": { type: String },
  "status": { type: String, default: "in-use" },
  "remarks": { type: String },
  "nameMr": { type: String, trim: true, default: '' },
  "locationMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "name": 1 });
schema.index({ "location": 1 });
schema.index({ "remarks": 1 });

export const modelName = "AssetRegister";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
