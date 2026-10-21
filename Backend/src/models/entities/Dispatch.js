import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("dispatch");
const schema = new mongoose.Schema({
  "dispatchNo": { type: String, required: [true, "Dispatch Number is required"], unique: true },
  "dispatchDate": { type: Date, required: [true, "Dispatch Date is required"] },
  "salesOrder": { type: mongoose.Schema.Types.ObjectId, ref: "SalesOrder", required: [true, "Sales Order is required"] },
  "customer": { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: [true, "Customer is required"] },
  "releaseOrder": { type: mongoose.Schema.Types.ObjectId, ref: "SalesReleaseOrder" },
  "vehicle": { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  "transporter": { type: mongoose.Schema.Types.ObjectId, ref: "Transporter" },
  "driverName": { type: String },
  "driverPhone": { type: String },
  "grade": { type: String },
  "bagsCount": { type: Number },
  "quantityMt": { type: Number, required: [true, "Dispatched Quantity is required"] },
  "destination": { type: String },
  "freightAmount": { type: Number, default: 0 },
  "ewayBillNo": { type: String },
  "status": { type: String, default: "planned" },
  "remarks": { type: String },
  "driverNameMr": { type: String, trim: true, default: '' },
  "destinationMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "driverName": 1 });
schema.index({ "driverPhone": 1 });
schema.index({ "destination": 1 });
schema.index({ "ewayBillNo": 1 });
schema.index({ "remarks": 1 });

export const modelName = "Dispatch";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
