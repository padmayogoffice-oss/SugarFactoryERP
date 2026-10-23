import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("sugarBagging");
const schema = new mongoose.Schema({
  "baggingNo": { type: String, required: [true, "Bagging Number is required"], unique: true },
  "baggingDate": { type: Date, required: [true, "Bagging Date is required"] },
  "shift": { type: String },
  "grade": { type: String, required: [true, "Sugar Grade is required"] },
  "bagsCount": { type: Number, required: [true, "No of Bags is required"] },
  "bagWeightKg": { type: Number, default: 50 },
  "warehouse": { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
  "godownLotNo": { type: String },
  "status": { type: String, default: "draft" },
  "remarks": { type: String },
  "remarksMr": { type: String, trim: true, default: '' },
  "item": { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
  "totalQtyMt": { type: Number },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "godownLotNo": 1 });
schema.index({ "remarks": 1 });

export const modelName = "SugarBagging";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };