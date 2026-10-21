import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("caneWeighment");
const schema = new mongoose.Schema({
  "slipNo": { type: String, required: [true, "Weighment Slip No is required"], unique: true },
  "weighDate": { type: Date, required: [true, "Weigh Date is required"] },
  "gateEntry": { type: mongoose.Schema.Types.ObjectId, ref: "CaneGateEntry" },
  "farmer": { type: mongoose.Schema.Types.ObjectId, ref: "Farmer", required: [true, "Farmer is required"] },
  "grossWeightMt": { type: Number, required: [true, "Gross Weight is required"] },
  "tareWeightMt": { type: Number, required: [true, "Tare Weight is required"] },
  "vehicle": { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  "shift": { type: String },
  "weighbridgeOperator": { type: String },
  "remarks": { type: String },
  "weighbridgeOperatorMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "weighbridgeOperator": 1 });
schema.index({ "remarks": 1 });

export const modelName = "CaneWeighment";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
