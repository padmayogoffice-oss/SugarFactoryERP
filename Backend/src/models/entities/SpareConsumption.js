import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("spareConsumption");
const schema = new mongoose.Schema({
  "entryNo": { type: String, required: [true, "Entry Number is required"], unique: true },
  "entryDate": { type: Date, required: [true, "Entry Date is required"] },
  "equipment": { type: mongoose.Schema.Types.ObjectId, ref: "Equipment", required: [true, "Equipment is required"] },
  "maintenanceRef": { type: String },
  "item": { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: [true, "Spare Item is required"] },
  "quantity": { type: Number, required: [true, "Quantity is required"] },
  "uom": { type: String, required: [true, "UOM is required"] },
  "rate": { type: Number },
  "issuedFrom": { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
  "remarks": { type: String },
  "remarksMr": { type: String, trim: true, default: '' },
  "breakdown": { type: mongoose.Schema.Types.ObjectId, ref: "BreakdownMaintenance" },
  "preventive": { type: mongoose.Schema.Types.ObjectId, ref: "PreventiveMaintenance" },
  "totalValue": { type: Number },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "maintenanceRef": 1 });
schema.index({ "remarks": 1 });

export const modelName = "SpareConsumption";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };