/**
 * Role model. A role is a named bundle of permission keys; users receive the
 * union of the permissions of all roles assigned to them.
 */
import mongoose from 'mongoose';

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
    // Optional Marathi (Devanagari) companions of the English fields.
    nameMr: { type: String, default: '', trim: true },
    descriptionMr: { type: String, default: '', trim: true },
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true },
);

roleSchema.index({ name: 1 });

export default mongoose.model('Role', roleSchema);
