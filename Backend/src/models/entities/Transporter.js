import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("transporter");
const schema = new mongoose.Schema({
  "code": { type: String, required: [true, "Transporter Code is required"], unique: true },
  "name": { type: String, required: [true, "Transporter Name is required"] },
  "contactPerson": { type: String },
  "phone": { type: String, required: [true, "Phone is required"] },
  "gstin": { type: String },
  "address": { type: String },
  "freightBasis": { type: String },
  "status": { type: String, default: "active" },
  "remarks": { type: String },
  "nameMr": { type: String, trim: true, default: '' },
  "contactPersonMr": { type: String, trim: true, default: '' },
  "addressMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "name": 1 });
schema.index({ "contactPerson": 1 });
schema.index({ "phone": 1 });
schema.index({ "gstin": 1 });
schema.index({ "address": 1 });
schema.index({ "remarks": 1 });

export const modelName = "Transporter";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
