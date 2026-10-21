import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("boilingHouseLog");
const schema = new mongoose.Schema({
  "logNo": { type: String, required: [true, "Log Number is required"], unique: true },
  "logDate": { type: Date, required: [true, "Log Date is required"] },
  "shift": { type: String, required: [true, "Shift is required"] },
  "massecuiteBoiledMt": { type: Number },
  "aSugarMt": { type: Number },
  "bSugarMt": { type: Number },
  "cSugarMt": { type: Number },
  "finalMolassesMt": { type: Number },
  "molassesPurity": { type: Number },
  "exhaustSteamPercent": { type: Number },
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
schema.index({ "remarks": 1 });

export const modelName = "BoilingHouseLog";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
