import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("uom");
const schema = new mongoose.Schema({
  "code": { type: String, required: [true, "UOM Code is required"], unique: true },
  "name": { type: String, required: [true, "UOM Name is required"] },
  "baseUom": { type: String },
  "conversionFactor": { type: Number, default: 1 },
  "status": { type: String, default: "active" },
  "nameMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "name": 1 });
schema.index({ "baseUom": 1 });

export const modelName = "Uom";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
