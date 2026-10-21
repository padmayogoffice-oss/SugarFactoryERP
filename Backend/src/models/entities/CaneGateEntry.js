import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("caneGateEntry");
const schema = new mongoose.Schema({
  "gatePassNo": { type: String, required: [true, "Gate Pass No is required"], unique: true },
  "entryDate": { type: Date, required: [true, "Entry Date is required"] },
  "vehicle": { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: [true, "Vehicle is required"] },
  "farmer": { type: mongoose.Schema.Types.ObjectId, ref: "Farmer", required: [true, "Farmer is required"] },
  "indent": { type: mongoose.Schema.Types.ObjectId, ref: "CaneIndent" },
  "transporter": { type: mongoose.Schema.Types.ObjectId, ref: "Transporter" },
  "driverName": { type: String },
  "driverMobile": { type: String },
  "arrivalTime": { type: String },
  "grossWeightMt": { type: Number },
  "tareWeightMt": { type: Number },
  "status": { type: String, default: "in-yard" },
  "remarks": { type: String },
  "driverNameMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "driverName": 1 });
schema.index({ "driverMobile": 1 });
schema.index({ "arrivalTime": 1 });
schema.index({ "remarks": 1 });

export const modelName = "CaneGateEntry";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
