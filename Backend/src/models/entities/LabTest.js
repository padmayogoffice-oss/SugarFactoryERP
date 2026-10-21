import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("labTest");
const schema = new mongoose.Schema({
  "testNo": { type: String, required: [true, "Test Number is required"], unique: true },
  "testDate": { type: Date, required: [true, "Test Date is required"] },
  "sampleType": { type: String, required: [true, "Sample Type is required"] },
  "sampleRefNo": { type: String },
  "batchNo": { type: String },
  "parameter": { type: String, required: [true, "Parameter is required"] },
  "observedValue": { type: Number, required: [true, "Observed Value is required"] },
  "specMin": { type: Number },
  "specMax": { type: Number },
  "result": { type: String, required: [true, "Result is required"] },
  "testedBy": { type: String, required: [true, "Tested By is required"] },
  "remarks": { type: String },
  "testedByMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "sampleRefNo": 1 });
schema.index({ "batchNo": 1 });
schema.index({ "parameter": 1 });
schema.index({ "testedBy": 1 });
schema.index({ "remarks": 1 });

export const modelName = "LabTest";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
