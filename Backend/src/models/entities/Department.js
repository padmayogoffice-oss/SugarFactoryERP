import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("department");
const schema = new mongoose.Schema({
  "code": { type: String, required: [true, "Department Code is required"], unique: true },
  "name": { type: String, required: [true, "Department Name is required"] },
  "category": { type: String, required: [true, "Category is required"] },
  "head": { type: String },
  "costCenter": { type: String },
  "status": { type: String, default: "active" },
  "remarks": { type: String },
  "nameMr": { type: String, trim: true, default: '' },
  "headMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "name": 1 });
schema.index({ "head": 1 });
schema.index({ "costCenter": 1 });
schema.index({ "remarks": 1 });

export const modelName = "Department";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
