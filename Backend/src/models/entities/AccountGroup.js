import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("accountGroup");
const schema = new mongoose.Schema({
  "code": { type: String, required: [true, "Group Code is required"], unique: true },
  "name": { type: String, required: [true, "Group Name is required"] },
  "parentGroup": { type: mongoose.Schema.Types.ObjectId, ref: "AccountGroup" },
  "nature": { type: String, required: [true, "Nature is required"] },
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
schema.index({ "remarks": 1 });

export const modelName = "AccountGroup";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
