import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("canePayment");
const schema = new mongoose.Schema({
  "paymentNo": { type: String, required: [true, "Payment Number is required"], unique: true },
  "paymentDate": { type: Date, required: [true, "Payment Date is required"] },
  "farmer": { type: mongoose.Schema.Types.ObjectId, ref: "Farmer", required: [true, "Farmer is required"] },
  "season": { type: String, required: [true, "Season is required"] },
  "totalQtyMt": { type: Number },
  "averageRatePerMt": { type: Number },
  "deductionAmount": { type: Number, default: 0 },
  "paymentMode": { type: String, default: "NEFT" },
  "bank": { type: mongoose.Schema.Types.ObjectId, ref: "Bank" },
  "status": { type: String, default: "pending" },
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

export const modelName = "CanePayment";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
