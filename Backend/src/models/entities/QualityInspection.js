import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("qualityInspection");
const schema = new mongoose.Schema({
  "inspectionNo": { type: String, required: [true, "Inspection No is required"], unique: true },
  "inspectionDate": { type: Date, required: [true, "Inspection Date is required"] },
  "goodsReceipt": { type: mongoose.Schema.Types.ObjectId, ref: "GoodsReceipt" },
  "item": { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: [true, "Item is required"] },
  "inspectedQty": { type: Number, required: [true, "Inspected Qty is required"] },
  "acceptedQty": { type: Number },
  "rejectedQty": { type: Number, default: 0 },
  "parameter": { type: String },
  "observedValue": { type: String },
  "specification": { type: String },
  "result": { type: String, required: [true, "Result is required"] },
  "inspectedBy": { type: String },
  "remarks": { type: String },
  "inspectedByMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "parameter": 1 });
schema.index({ "observedValue": 1 });
schema.index({ "specification": 1 });
schema.index({ "inspectedBy": 1 });
schema.index({ "remarks": 1 });

export const modelName = "QualityInspection";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
