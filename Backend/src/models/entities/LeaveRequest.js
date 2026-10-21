import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("leaveRequest");
const schema = new mongoose.Schema({
  "requestNo": { type: String, required: [true, "Request Number is required"], unique: true },
  "employee": { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: [true, "Employee is required"] },
  "leaveType": { type: mongoose.Schema.Types.ObjectId, ref: "LeaveType", required: [true, "Leave Type is required"] },
  "fromDate": { type: Date, required: [true, "From Date is required"] },
  "toDate": { type: Date, required: [true, "To Date is required"] },
  "days": { type: Number, required: [true, "Number of Days is required"] },
  "reason": { type: String },
  "status": { type: String, default: "pending" },
  "remarks": { type: String },
  "reasonMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "reason": 1 });
schema.index({ "approvedBy": 1 });
schema.index({ "remarks": 1 });

export const modelName = "LeaveRequest";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
