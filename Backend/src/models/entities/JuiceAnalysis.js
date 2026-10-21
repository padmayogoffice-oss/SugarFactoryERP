import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("juiceAnalysis");
const schema = new mongoose.Schema({
  "sampleNo": { type: String, required: [true, "Sample Number is required"], unique: true },
  "sampleDate": { type: Date, required: [true, "Sample Date is required"] },
  "shift": { type: String },
  "stage": { type: String, required: [true, "Stage is required"] },
  "brixPercent": { type: Number, required: [true, "Brix % is required"] },
  "polPercent": { type: Number, required: [true, "Pol % is required"] },
  "phValue": { type: Number },
  "temperatureC": { type: Number },
  "analyst": { type: String },
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
schema.index({ "analyst": 1 });
schema.index({ "remarks": 1 });

export const modelName = "JuiceAnalysis";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
