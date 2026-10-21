import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("notificationTemplate");
const schema = new mongoose.Schema({
  "code": { type: String, required: [true, "Template Code is required"], unique: true },
  "name": { type: String, required: [true, "Template Name is required"] },
  "channel": { type: String, required: [true, "Channel is required"] },
  "event": { type: String, required: [true, "Trigger Event is required"] },
  "subject": { type: String },
  "body": { type: String },
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
schema.index({ "event": 1 });
schema.index({ "subject": 1 });
schema.index({ "body": 1 });

export const modelName = "NotificationTemplate";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
