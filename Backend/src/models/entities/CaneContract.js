import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("caneContract");
const schema = new mongoose.Schema({
  "contractNo": { type: String, required: [true, "Contract Number is required"], unique: true },
  "farmer": { type: mongoose.Schema.Types.ObjectId, ref: "Farmer", required: [true, "Farmer is required"] },
  "season": { type: String, required: [true, "Season is required"] },
  "contractedAreaHectare": { type: Number, required: [true, "Contracted Area is required"] },
  "expectedQtyMt": { type: Number, required: [true, "Expected Quantity is required"] },
  "supplyStartDate": { type: Date },
  "supplyEndDate": { type: Date },
  "ratePerMt": { type: Number },
  "harvestingMode": { type: String, default: "Farmer" },
  "transportMode": { type: String, default: "Farmer" },
  "approvalStatus": { type: String, default: "pending" },
  "remarks": { type: String },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "approvedBy": 1 });
schema.index({ "remarks": 1 });

export const modelName = "CaneContract";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
