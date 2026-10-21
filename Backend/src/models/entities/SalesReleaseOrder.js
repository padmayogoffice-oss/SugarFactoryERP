import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("salesReleaseOrder");
const schema = new mongoose.Schema({
  "releaseNo": { type: String, required: [true, "Release Order No is required"], unique: true },
  "releaseDate": { type: Date, required: [true, "Release Date is required"] },
  "salesOrder": { type: mongoose.Schema.Types.ObjectId, ref: "SalesOrder", required: [true, "Sales Order is required"] },
  "customer": { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: [true, "Customer is required"] },
  "releasedQtyMt": { type: Number, required: [true, "Released Quantity is required"] },
  "warehouse": { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
  "validUpto": { type: Date },
  "status": { type: String, default: "issued" },
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

export const modelName = "SalesReleaseOrder";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
