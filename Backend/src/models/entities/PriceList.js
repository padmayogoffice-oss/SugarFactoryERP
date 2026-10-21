import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("priceList");
const schema = new mongoose.Schema({
  "code": { type: String, required: [true, "Price List Code is required"], unique: true },
  "name": { type: String, required: [true, "Price List Name is required"] },
  "grade": { type: String, required: [true, "Grade is required"] },
  "customerType": { type: String },
  "ratePerMt": { type: Number, required: [true, "Rate is required"] },
  "effectiveFrom": { type: Date, required: [true, "Effective From is required"] },
  "effectiveTo": { type: Date },
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

export const modelName = "PriceList";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
