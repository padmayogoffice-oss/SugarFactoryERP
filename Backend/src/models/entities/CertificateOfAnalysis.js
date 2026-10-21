import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("certificateOfAnalysis");
const schema = new mongoose.Schema({
  "certificateNo": { type: String, required: [true, "Certificate Number is required"], unique: true },
  "certificateDate": { type: Date, required: [true, "Certificate Date is required"] },
  "batchNo": { type: String, required: [true, "Batch / Lot No is required"] },
  "product": { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: [true, "Product is required"] },
  "grade": { type: String },
  "customer": { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  "parameterSummary": { type: String },
  "overallResult": { type: String, required: [true, "Overall Result is required"] },
  "issuedBy": { type: String, required: [true, "Issued By is required"] },
  "status": { type: String, default: "draft" },
  "remarks": { type: String },
  "issuedByMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "batchNo": 1 });
schema.index({ "parameterSummary": 1 });
schema.index({ "issuedBy": 1 });
schema.index({ "remarks": 1 });

export const modelName = "CertificateOfAnalysis";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
