import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("caneQuality");
const schema = new mongoose.Schema({
  "sampleNo": { type: String, required: [true, "Sample Number is required"], unique: true },
  "sampleDate": { type: Date, required: [true, "Sample Date is required"] },
  "farmer": { type: mongoose.Schema.Types.ObjectId, ref: "Farmer", required: [true, "Farmer is required"] },
  "weighment": { type: mongoose.Schema.Types.ObjectId, ref: "CaneWeighment" },
  "caneVariety": { type: String },
  "polPercent": { type: Number, required: [true, "Pol % is required"] },
  "brixPercent": { type: Number, required: [true, "Brix % is required"] },
  "fibrePercent": { type: Number },
  "analyst": { type: String },
  "status": { type: String, default: "sampled" },
  "remarks": { type: String },
  "analystMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "caneVariety": 1 });
schema.index({ "analyst": 1 });
schema.index({ "remarks": 1 });

export const modelName = "CaneQuality";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
