import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("financialYear");
const schema = new mongoose.Schema({
  "code": { type: String, required: [true, "FY Code is required"], unique: true },
  "startDate": { type: Date, required: [true, "Start Date is required"] },
  "endDate": { type: Date, required: [true, "End Date is required"] },
  "season": { type: String, required: [true, "Season is required"] },
  "isCurrent": { type: Boolean, default: false },
  "isClosed": { type: Boolean, default: false },
  "remarks": { type: String },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "remarks": 1 });

export const modelName = "FinancialYear";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
