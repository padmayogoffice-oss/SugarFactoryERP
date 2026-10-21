import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("sampleCollection");
const schema = new mongoose.Schema({
  "sampleNo": { type: String, required: [true, "Sample Number is required"], unique: true },
  "collectionDate": { type: Date, required: [true, "Collection Date is required"] },
  "collectionPoint": { type: String, required: [true, "Collection Point is required"] },
  "shift": { type: String },
  "sampleType": { type: String, required: [true, "Sample Type is required"] },
  "collectedBy": { type: String, required: [true, "Collected By is required"] },
  "status": { type: String, default: "collected" },
  "remarks": { type: String },
  "collectedByMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "collectedBy": 1 });
schema.index({ "remarks": 1 });

export const modelName = "SampleCollection";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
