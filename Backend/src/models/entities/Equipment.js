import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("equipment");
const schema = new mongoose.Schema({
  "code": { type: String, required: [true, "Equipment Code is required"], unique: true },
  "name": { type: String, required: [true, "Equipment Name is required"] },
  "category": { type: String, required: [true, "Category is required"] },
  "section": { type: String, required: [true, "Section is required"] },
  "make": { type: String },
  "model": { type: String },
  "serialNo": { type: String },
  "capacity": { type: String },
  "installationDate": { type: Date },
  "location": { type: String },
  "status": { type: String, default: "running" },
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
schema.index({ "make": 1 });
schema.index({ "model": 1 });
schema.index({ "serialNo": 1 });
schema.index({ "capacity": 1 });
schema.index({ "location": 1 });
schema.index({ "remarks": 1 });

export const modelName = "Equipment";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
