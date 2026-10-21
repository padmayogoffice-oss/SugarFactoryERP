import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("salesReturn");
const schema = new mongoose.Schema({
  "returnNo": { type: String, required: [true, "Return Number is required"], unique: true },
  "returnDate": { type: Date, required: [true, "Return Date is required"] },
  "customer": { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: [true, "Customer is required"] },
  "invoice": { type: mongoose.Schema.Types.ObjectId, ref: "SalesInvoice" },
  "grade": { type: String },
  "quantityMt": { type: Number, required: [true, "Returned Quantity is required"] },
  "rate": { type: Number, required: [true, "Rate is required"] },
  "reason": { type: String, required: [true, "Reason is required"] },
  "creditNoteNo": { type: String },
  "status": { type: String, default: "draft" },
  "remarks": { type: String },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "creditNoteNo": 1 });
schema.index({ "remarks": 1 });

export const modelName = "SalesReturn";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
