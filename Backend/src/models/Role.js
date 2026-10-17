const mongoose = require('mongoose');

/**
 * Role documents hold the permission keys granted to users assigned that role.
 * The wildcard permission `*` grants everything and is reserved for the
 * built-in Super Admin role.
 */
const roleSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true },
);

roleSchema.index({ name: 1 });

module.exports = mongoose.model('Role', roleSchema);
