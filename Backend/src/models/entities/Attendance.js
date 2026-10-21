import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("attendance");
const schema = new mongoose.Schema({
  "attendanceDate": { type: Date, required: [true, "Attendance Date is required"] },
  "employee": { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: [true, "Employee is required"] },
  "shift": { type: String },
  "status": { type: String, required: [true, "Attendance Status is required"] },
  "inTime": { type: String },
  "outTime": { type: String },
  "workedHours": { type: Number },
  "overtimeHours": { type: Number, default: 0 },
  "department": { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  "remarks": { type: String },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "inTime": 1 });
schema.index({ "outTime": 1 });
schema.index({ "remarks": 1 });

export const modelName = "Attendance";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
