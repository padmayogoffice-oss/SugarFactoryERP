import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("paymentTerm");
const schema = new mongoose.Schema({
  "code": { type: String, required: [true, "Term Code is required"], unique: true },
  "name": { type: String, required: [true, "Term Name is required"] },
  "dueDays": { type: Number, required: [true, "Due Days is required"], default: 30 },
  "discountPercent": { type: Number, default: 0 },
  "mode": { type: String },
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

export const modelName = "PaymentTerm";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
