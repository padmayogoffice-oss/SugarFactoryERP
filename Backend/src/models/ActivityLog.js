/**
 * Audit trail of user actions. Rows are append-only and are written by the
 * auditLog middleware after a successful write request.
 */
import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    userName: { type: String, default: '' },
    userEmail: { type: String, default: '' },
    module: { type: String, required: true, index: true },
    submodule: { type: String, default: '' },
    action: { type: String, required: true, index: true },
    resourceId: { type: String, default: '' },
    resourceLabel: { type: String, default: '' },
    description: { type: String, default: '' },
    method: { type: String, default: '' },
    path: { type: String, default: '' },
    statusCode: { type: Number },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

activityLogSchema.index({ createdAt: -1 });

export default mongoose.model('ActivityLog', activityLogSchema);
