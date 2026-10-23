import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("stockTransfer");
const schema = new mongoose.Schema({
  "transferNo": { type: String, required: [true, "Transfer Number is required"], unique: true },
  "transferDate": { type: Date, required: [true, "Transfer Date is required"] },
  "fromWarehouse": { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: [true, "From Warehouse is required"] },
  "toWarehouse": { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: [true, "To Warehouse is required"] },
  "item": { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: [true, "Item is required"] },
  "quantity": { type: Number, required: [true, "Quantity is required"] },
  "uom": { type: String, required: [true, "UOM is required"] },
  "rate": { type: Number },
  "vehicleNo": { type: String },
  "status": { type: String, default: "draft" },
  "remarks": { type: String },
  "remarksMr": { type: String, trim: true, default: '' },
  "totalValue": { type: Number },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "vehicleNo": 1 });
schema.index({ "remarks": 1 });

export const modelName = "StockTransfer";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };