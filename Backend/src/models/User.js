/**
 * User account model. Passwords are stored only as a bcrypt hash and the hash is
 * excluded from queries by default (`select: false`) and stripped on serialisation.
 * Lockout and password-change timestamps back the auth middleware checks.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

const userSchema = new mongoose.Schema(
  {
    employeeCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, default: '', trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
    passwordHash: { type: String, required: true, select: false },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    designation: { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
    isSuperAdmin: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive', 'locked'], default: 'active' },
    lastLoginAt: { type: Date, default: null },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    remarks: { type: String, default: '' },
  },
  { timestamps: true },
);

userSchema.virtual('fullName').get(function fullName() {
  return [this.firstName, this.lastName].filter(Boolean).join(' ');
});

userSchema.methods.setPassword = async function setPassword(plainPassword) {
  this.passwordHash = await bcrypt.hash(plainPassword, env.bcryptRounds);
  // Stamped so the auth middleware can invalidate tokens issued before the change.
  this.passwordChangedAt = new Date();
};

userSchema.methods.verifyPassword = function verifyPassword(plainPassword) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.methods.isLocked = function isLocked() {
  return Boolean(this.lockedUntil && this.lockedUntil > new Date());
};

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.failedLoginAttempts;
    delete ret.lockedUntil;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
