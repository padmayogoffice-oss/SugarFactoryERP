import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("customer");
const schema = new mongoose.Schema({
  "code": { type: String, required: [true, "Customer Code is required"], unique: true },
  "name": { type: String, required: [true, "Customer Name is required"] },
  "customerType": { type: String, required: [true, "Customer Type is required"] },
  "gstin": { type: String },
  "pan": { type: String },
  "contactPerson": { type: String },
  "phone": { type: String, required: [true, "Phone is required"] },
  "email": { type: String },
  "billingAddress": { type: String },
  "city": { type: String },
  "state": { type: String },
  "creditDays": { type: Number, default: 30 },
  "creditLimit": { type: Number, default: 0 },
  "priceList": { type: String },
  "status": { type: String, default: "active" },
  "remarks": { type: String },
  "nameMr": { type: String, trim: true, default: '' },
  "contactPersonMr": { type: String, trim: true, default: '' },
  "billingAddressMr": { type: String, trim: true, default: '' },
  "cityMr": { type: String, trim: true, default: '' },
  "stateMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "name": 1 });
schema.index({ "gstin": 1 });
schema.index({ "pan": 1 });
schema.index({ "contactPerson": 1 });
schema.index({ "phone": 1 });
schema.index({ "email": 1 });
schema.index({ "billingAddress": 1 });
schema.index({ "city": 1 });
schema.index({ "state": 1 });
schema.index({ "priceList": 1 });
schema.index({ "remarks": 1 });

export const modelName = "Customer";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
