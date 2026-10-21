import mongoose from 'mongoose';
import { getSubmodule } from '../../registry/index.js';

const { module, submodule } = getSubmodule("employee");
const schema = new mongoose.Schema({
  "employeeCode": { type: String, required: [true, "Employee Code is required"], unique: true },
  "firstName": { type: String, required: [true, "First Name is required"] },
  "lastName": { type: String },
  "fatherName": { type: String },
  "gender": { type: String, required: [true, "Gender is required"] },
  "dateOfBirth": { type: Date },
  "mobile": { type: String, required: [true, "Mobile is required"] },
  "email": { type: String },
  "aadhaarNo": { type: String },
  "panNo": { type: String },
  "department": { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: [true, "Department is required"] },
  "designation": { type: mongoose.Schema.Types.ObjectId, ref: "Designation", required: [true, "Designation is required"] },
  "dateOfJoining": { type: Date, required: [true, "Date of Joining is required"] },
  "employmentType": { type: String, required: [true, "Employment Type is required"] },
  "shift": { type: String },
  "basicSalary": { type: Number, required: [true, "Basic Salary is required"] },
  "bankName": { type: String },
  "accountNo": { type: String },
  "ifsc": { type: String },
  "pfNo": { type: String },
  "esiNo": { type: String },
  "status": { type: String, default: "active" },
  "remarks": { type: String },
  "firstNameMr": { type: String, trim: true, default: '' },
  "lastNameMr": { type: String, trim: true, default: '' },
  "fatherNameMr": { type: String, trim: true, default: '' },
  "bankNameMr": { type: String, trim: true, default: '' },
  "remarksMr": { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
schema.index({ "firstName": 1 });
schema.index({ "lastName": 1 });
schema.index({ "fatherName": 1 });
schema.index({ "mobile": 1 });
schema.index({ "email": 1 });
schema.index({ "aadhaarNo": 1 });
schema.index({ "panNo": 1 });
schema.index({ "bankName": 1 });
schema.index({ "accountNo": 1 });
schema.index({ "ifsc": 1 });
schema.index({ "pfNo": 1 });
schema.index({ "esiNo": 1 });
schema.index({ "remarks": 1 });

export const modelName = "Employee";
export const model = mongoose.models[modelName] || mongoose.model(modelName, schema);
export { module, submodule };
