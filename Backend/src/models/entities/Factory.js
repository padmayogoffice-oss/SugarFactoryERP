import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("factory");
const schema = new mongoose.Schema({
  "code": { type: String, required: [true, "Unit Code is required"], unique: true },
  "name": { type: String, required: [true, "Unit Name is required"] },
  "unitType": { type: String, required: [true, "Unit Type is required"] },
  "parentFactory": { type: mongoose.Schema.Types.ObjectId, ref: "FactoryRegistration" },
  "location": { type: String },
  "capacityTcd": { type: Number },
  "commissionedOn": { type: Date },
  "status": { type: String, default: "active" },
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

export const modelName = "Factory";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
