import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("shiftProduction");
const schema = new mongoose.Schema({
  "entryNo": { type: String, required: [true, "Entry Number is required"], unique: true },
  "productionDate": { type: Date, required: [true, "Production Date is required"] },
  "shift": { type: String, required: [true, "Shift is required"] },
  "caneCrushedMt": { type: Number, required: [true, "Cane Crushed is required"] },
  "sugarProducedMt": { type: Number, required: [true, "Sugar Produced is required"] },
  "molassesProducedMt": { type: Number },
  "bagasseProducedMt": { type: Number },
  "pressMudMt": { type: Number },
  "steamGeneratedMt": { type: Number },
  "powerGeneratedKwh": { type: Number },
  "downtimeHours": { type: Number },
  "shiftIncharge": { type: String },
  "status": { type: String, default: "draft" },
  "remarks": { type: String },
  "shiftInchargeMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "shiftIncharge": 1 });
schema.index({ "remarks": 1 });

export const modelName = "ShiftProduction";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
