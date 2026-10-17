/**
 * Audit trail middleware. It hooks `res.on('finish')` so a log entry is written
 * only after the response succeeds, and it records the actor, the resource and
 * the request metadata for every write operation.
 */
import ActivityLog from '../models/ActivityLog.js';

const WRITE_ACTIONS = { POST: 'create', PUT: 'update', PATCH: 'update', DELETE: 'delete' };

/**
 * Records write operations in the audit trail. Logging failures never break the
 * request; they are reported on stderr instead.
 */
function auditLog({ module, submodule = '' } = {}) {
  return (req, res, next) => {
    const action = WRITE_ACTIONS[req.method];
    if (!action) return next();

    res.on('finish', () => {
      if (res.statusCode >= 400) return;

      ActivityLog.create({
        user: req.user?._id,
        userName: req.user ? [req.user.firstName, req.user.lastName].filter(Boolean).join(' ') : 'system',
        userEmail: req.user?.email || '',
        module: module || req.baseUrl.split('/').filter(Boolean).pop() || 'unknown',
        submodule,
        action,
        resourceId: res.locals?.resourceId ? String(res.locals.resourceId) : '',
        resourceLabel: res.locals?.resourceLabel || '',
        description: res.locals?.auditDescription || `${action} ${submodule || module}`,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        ipAddress: req.ip || '',
        userAgent: req.get('user-agent') || '',
      }).catch((error) => {
        console.error('[audit] failed to write activity log', error.message);
      });
    });

    return next();
  };
}

export { auditLog };
