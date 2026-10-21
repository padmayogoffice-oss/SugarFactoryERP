import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("integration");
const schema = new mongoose.Schema({
  "name": { type: String, required: [true, "Integration is required"] },
  "provider": { type: String, required: [true, "Provider is required"] },
  "endpoint": { type: String },
  "apiKey": { type: String },
  "isEnabled": { type: Boolean, default: false },
  "remarks": { type: String },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "name": 1 });
schema.index({ "endpoint": 1 });
schema.index({ "apiKey": 1 });
schema.index({ "remarks": 1 });

export const modelName = "Integration";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
