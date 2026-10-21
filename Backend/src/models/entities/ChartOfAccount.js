import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("chartOfAccount");
const schema = new mongoose.Schema({
  "code": { type: String, required: [true, "Account Code is required"], unique: true },
  "name": { type: String, required: [true, "Account Name is required"] },
  "accountGroup": { type: mongoose.Schema.Types.ObjectId, ref: "AccountGroup", required: [true, "Account Group is required"] },
  "accountType": { type: String, required: [true, "Account Type is required"] },
  "openingBalance": { type: Number, default: 0 },
  "openingType": { type: String, default: "Debit" },
  "isBank": { type: Boolean, default: false },
  "status": { type: String, default: "active" },
  "remarks": { type: String },
  "nameMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "name": 1 });
schema.index({ "remarks": 1 });

export const modelName = "ChartOfAccount";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
