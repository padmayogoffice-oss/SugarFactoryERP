import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("salesEnquiry");
const schema = new mongoose.Schema({
  "enquiryNo": { type: String, required: [true, "Enquiry No is required"], unique: true },
  "enquiryDate": { type: Date, required: [true, "Enquiry Date is required"] },
  "customer": { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: [true, "Customer is required"] },
  "product": { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: [true, "Product is required"] },
  "grade": { type: String },
  "quantityMt": { type: Number, required: [true, "Quantity is required"] },
  "expectedRate": { type: Number },
  "deliveryLocation": { type: String },
  "validUpto": { type: Date },
  "status": { type: String, default: "new" },
  "remarks": { type: String },
  "deliveryLocationMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "deliveryLocation": 1 });
schema.index({ "remarks": 1 });

export const modelName = "SalesEnquiry";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
