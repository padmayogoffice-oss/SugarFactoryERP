import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("goodsReceipt");
const schema = new mongoose.Schema({
  "grnNo": { type: String, required: [true, "GRN Number is required"], unique: true },
  "grnDate": { type: Date, required: [true, "GRN Date is required"] },
  "purchaseOrder": { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder" },
  "supplier": { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: [true, "Vendor is required"] },
  "item": { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: [true, "Item is required"] },
  "receivedQty": { type: Number, required: [true, "Received Qty is required"] },
  "acceptedQty": { type: Number },
  "rejectedQty": { type: Number, default: 0 },
  "uom": { type: String, required: [true, "UOM is required"] },
  "rate": { type: Number },
  "invoiceNo": { type: String },
  "invoiceDate": { type: Date },
  "warehouse": { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: [true, "Warehouse is required"] },
  "vehicleNo": { type: String },
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
schema.index({ "invoiceNo": 1 });
schema.index({ "vehicleNo": 1 });
schema.index({ "remarks": 1 });

export const modelName = "GoodsReceipt";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
