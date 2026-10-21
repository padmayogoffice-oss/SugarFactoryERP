import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("companySetting");
const schema = new mongoose.Schema({
  "companyName": { type: String, required: [true, "Company Name is required"] },
  "legalName": { type: String },
  "gstin": { type: String },
  "pan": { type: String },
  "address": { type: String },
  "phone": { type: String },
  "email": { type: String },
  "website": { type: String },
  "currency": { type: String, default: "INR" },
  "financialYearStart": { type: String, default: "April" },
  "timezone": { type: String, default: "Asia/Kolkata" },
  "logoUrl": { type: String },
  "remarks": { type: String },
  "companyNameMr": { type: String, trim: true, default: '' },
  "legalNameMr": { type: String, trim: true, default: '' },
  "addressMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "companyName": 1 });
schema.index({ "legalName": 1 });
schema.index({ "gstin": 1 });
schema.index({ "pan": 1 });
schema.index({ "address": 1 });
schema.index({ "phone": 1 });
schema.index({ "email": 1 });
schema.index({ "website": 1 });
schema.index({ "logoUrl": 1 });
schema.index({ "remarks": 1 });

export const modelName = "CompanySetting";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
