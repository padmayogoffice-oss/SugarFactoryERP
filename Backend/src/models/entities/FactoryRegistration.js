import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("factoryRegistration");
const schema = new mongoose.Schema({
  "code": { type: String, required: [true, "Registration Code is required"], unique: true },
  "name": { type: String, required: [true, "Factory Name is required"] },
  "legalEntity": { type: String, required: [true, "Legal Entity Name is required"] },
  "registrationNo": { type: String, required: [true, "Registration Number is required"] },
  "gstin": { type: String, required: [true, "GSTIN is required"] },
  "pan": { type: String, required: [true, "PAN is required"] },
  "licenseNo": { type: String },
  "crushingCapacityTcd": { type: Number, required: [true, "Crushing Capacity is required"] },
  "season": { type: String, required: [true, "Operating Season is required"] },
  "registeredOn": { type: Date, required: [true, "Registered On is required"] },
  "addressLine1": { type: String, required: [true, "Address Line 1 is required"] },
  "addressLine2": { type: String },
  "village": { type: String },
  "district": { type: String, required: [true, "District is required"] },
  "state": { type: String, required: [true, "State is required"] },
  "pincode": { type: String },
  "contactPerson": { type: String, required: [true, "Contact Person is required"] },
  "contactPhone": { type: String, required: [true, "Contact Phone is required"] },
  "contactEmail": { type: String },
  "website": { type: String },
  "status": { type: String, default: "active" },
  "remarks": { type: String },
  "nameMr": { type: String, trim: true, default: '' },
  "legalEntityMr": { type: String, trim: true, default: '' },
  "addressLine1Mr": { type: String, trim: true, default: '' },
  "addressLine2Mr": { type: String, trim: true, default: '' },
  "villageMr": { type: String, trim: true, default: '' },
  "districtMr": { type: String, trim: true, default: '' },
  "stateMr": { type: String, trim: true, default: '' },
  "contactPersonMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "name": 1 });
schema.index({ "legalEntity": 1 });
schema.index({ "registrationNo": 1 });
schema.index({ "gstin": 1 });
schema.index({ "pan": 1 });
schema.index({ "licenseNo": 1 });
schema.index({ "addressLine1": 1 });
schema.index({ "addressLine2": 1 });
schema.index({ "village": 1 });
schema.index({ "district": 1 });
schema.index({ "state": 1 });
schema.index({ "pincode": 1 });
schema.index({ "contactPerson": 1 });
schema.index({ "contactPhone": 1 });
schema.index({ "contactEmail": 1 });
schema.index({ "website": 1 });
schema.index({ "remarks": 1 });

export const modelName = "FactoryRegistration";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
