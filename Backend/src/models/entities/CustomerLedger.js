import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("customerLedger");
const schema = new mongoose.Schema({
  "entryNo": { type: String, required: [true, "Entry Number is required"], unique: true },
  "entryDate": { type: Date, required: [true, "Entry Date is required"] },
  "customer": { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: [true, "Customer is required"] },
  "documentType": { type: String, required: [true, "Document Type is required"] },
  "documentNo": { type: String },
  "debitAmount": { type: Number, default: 0 },
  "creditAmount": { type: Number, default: 0 },
  "dueDate": { type: Date },
  "remarks": { type: String },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "documentNo": 1 });
schema.index({ "remarks": 1 });

export const modelName = "CustomerLedger";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
