import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("leaveType");
const schema = new mongoose.Schema({
  "code": { type: String, required: [true, "Leave Code is required"], unique: true },
  "name": { type: String, required: [true, "Leave Type is required"] },
  "annualQuota": { type: Number, required: [true, "Annual Quota is required"] },
  "isPaid": { type: Boolean, default: true },
  "carryForward": { type: Boolean, default: false },
  "status": { type: String, default: "active" },
  "nameMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "name": 1 });

export const modelName = "LeaveType";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
