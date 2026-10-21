import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("caneIndent");
const schema = new mongoose.Schema({
  "indentNo": { type: String, required: [true, "Indent Number is required"], unique: true },
  "indentDate": { type: Date, required: [true, "Indent Date is required"] },
  "farmer": { type: mongoose.Schema.Types.ObjectId, ref: "Farmer", required: [true, "Farmer is required"] },
  "contract": { type: mongoose.Schema.Types.ObjectId, ref: "CaneContract" },
  "harvestingDate": { type: Date, required: [true, "Harvesting Date is required"] },
  "expectedQtyMt": { type: Number },
  "vehicle": { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  "harvestingGroup": { type: String },
  "status": { type: String, default: "pending" },
  "remarks": { type: String },
  "harvestingGroupMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "harvestingGroup": 1 });
schema.index({ "remarks": 1 });

export const modelName = "CaneIndent";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
