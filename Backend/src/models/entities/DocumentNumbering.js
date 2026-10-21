import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("documentNumbering");
const schema = new mongoose.Schema({
  "code": { type: String, required: [true, "Sequence Code is required"], unique: true },
  "name": { type: String, required: [true, "Document Type is required"] },
  "prefix": { type: String, required: [true, "Prefix is required"] },
  "suffix": { type: String },
  "padding": { type: Number, default: 5 },
  "includeYear": { type: Boolean, default: true },
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
schema.index({ "prefix": 1 });
schema.index({ "suffix": 1 });

export const modelName = "DocumentNumbering";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
