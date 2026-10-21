import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("qualitySpecification");
const schema = new mongoose.Schema({
  "code": { type: String, required: [true, "Spec Code is required"], unique: true },
  "name": { type: String, required: [true, "Specification Name is required"] },
  "appliesTo": { type: String, required: [true, "Applies To is required"] },
  "parameter": { type: String, required: [true, "Parameter is required"] },
  "minValue": { type: Number },
  "maxValue": { type: Number },
  "unit": { type: String },
  "testMethod": { type: String },
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
schema.index({ "parameter": 1 });
schema.index({ "testMethod": 1 });
schema.index({ "remarks": 1 });

export const modelName = "QualitySpecification";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
