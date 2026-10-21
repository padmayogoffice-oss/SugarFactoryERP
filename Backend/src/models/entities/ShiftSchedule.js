import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("shiftSchedule");
const schema = new mongoose.Schema({
  "scheduleNo": { type: String, required: [true, "Schedule Number is required"], unique: true },
  "scheduleDate": { type: Date, required: [true, "Schedule Date is required"] },
  "employee": { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: [true, "Employee is required"] },
  "shift": { type: String, required: [true, "Shift is required"] },
  "department": { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  "weekOff": { type: Boolean, default: false },
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

export const modelName = "ShiftSchedule";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
