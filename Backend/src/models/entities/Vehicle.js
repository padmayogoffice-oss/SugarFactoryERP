import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("vehicle");
const schema = new mongoose.Schema({
  "vehicleNo": { type: String, required: [true, "Vehicle Number is required"], unique: true },
  "vehicleType": { type: String, required: [true, "Vehicle Type is required"] },
  "capacityMt": { type: Number },
  "ownerType": { type: String, required: [true, "Ownership is required"] },
  "ownerName": { type: String },
  "transporter": { type: mongoose.Schema.Types.ObjectId, ref: "Transporter" },
  "driverName": { type: String },
  "driverPhone": { type: String },
  "fitnessValidUpto": { type: Date },
  "insuranceValidUpto": { type: Date },
  "status": { type: String, default: "active" },
  "remarks": { type: String },
  "ownerNameMr": { type: String, trim: true, default: '' },
  "driverNameMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "ownerName": 1 });
schema.index({ "driverName": 1 });
schema.index({ "driverPhone": 1 });
schema.index({ "remarks": 1 });

export const modelName = "Vehicle";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
