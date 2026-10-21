import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("farmer");
const schema = new mongoose.Schema({
  "code": { type: String, required: [true, "Farmer Code is required"], unique: true },
  "name": { type: String, required: [true, "Farmer Name is required"] },
  "fatherName": { type: String },
  "mobile": { type: String, required: [true, "Mobile Number is required"] },
  "aadhaarNo": { type: String },
  "village": { type: String, required: [true, "Village is required"] },
  "tehsil": { type: String },
  "district": { type: String, required: [true, "District is required"] },
  "state": { type: String },
  "surveyNo": { type: String },
  "areaHectare": { type: Number, required: [true, "Cane Area is required"] },
  "caneVariety": { type: String },
  "irrigationType": { type: String },
  "bankName": { type: String },
  "accountNo": { type: String },
  "ifsc": { type: String },
  "status": { type: String, default: "active" },
  "remarks": { type: String },
  "nameMr": { type: String, trim: true, default: '' },
  "fatherNameMr": { type: String, trim: true, default: '' },
  "villageMr": { type: String, trim: true, default: '' },
  "tehsilMr": { type: String, trim: true, default: '' },
  "districtMr": { type: String, trim: true, default: '' },
  "stateMr": { type: String, trim: true, default: '' },
  "bankNameMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "name": 1 });
schema.index({ "fatherName": 1 });
schema.index({ "mobile": 1 });
schema.index({ "aadhaarNo": 1 });
schema.index({ "village": 1 });
schema.index({ "tehsil": 1 });
schema.index({ "district": 1 });
schema.index({ "state": 1 });
schema.index({ "surveyNo": 1 });
schema.index({ "bankName": 1 });
schema.index({ "accountNo": 1 });
schema.index({ "ifsc": 1 });
schema.index({ "remarks": 1 });

export const modelName = "Farmer";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
