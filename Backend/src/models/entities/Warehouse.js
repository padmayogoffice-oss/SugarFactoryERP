import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("warehouse");
const schema = new mongoose.Schema({
  "code": { type: String, required: [true, "Warehouse Code is required"], unique: true },
  "name": { type: String, required: [true, "Warehouse Name is required"] },
  "warehouseType": { type: String, required: [true, "Type is required"] },
  "factoryUnit": { type: mongoose.Schema.Types.ObjectId, ref: "Factory" },
  "location": { type: String },
  "capacityMt": { type: Number },
  "incharge": { type: String },
  "status": { type: String, default: "active" },
  "remarks": { type: String },
  "nameMr": { type: String, trim: true, default: '' },
  "locationMr": { type: String, trim: true, default: '' },
  "inchargeMr": { type: String, trim: true, default: '' },
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
schema.index({ "incharge": 1 });
schema.index({ "remarks": 1 });

export const modelName = "Warehouse";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
