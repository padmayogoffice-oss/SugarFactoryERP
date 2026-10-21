import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("bank");
const schema = new mongoose.Schema({
  "code": { type: String, required: [true, "Bank Code is required"], unique: true },
  "name": { type: String, required: [true, "Bank Name is required"] },
  "branch": { type: String },
  "accountNo": { type: String, required: [true, "Account Number is required"], unique: true },
  "ifsc": { type: String, required: [true, "IFSC Code is required"] },
  "accountType": { type: String, default: "Current" },
  "openingBalance": { type: Number, default: 0 },
  "status": { type: String, default: "active" },
  "remarks": { type: String },
  "nameMr": { type: String, trim: true, default: '' },
  "branchMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "name": 1 });
schema.index({ "branch": 1 });
schema.index({ "ifsc": 1 });
schema.index({ "remarks": 1 });

export const modelName = "Bank";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
