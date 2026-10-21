/**
 * Dashboard routes. Each KPI card, chart and the activity feed is included only
 * when the caller holds the matching permission, so a store keeper sees stock
 * figures but never finance totals.
 */
import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';
import { authenticate } from '../middlewares/auth.js';
import * as analytics from '../services/analyticsService.js';
import { hasPermission } from '../services/permissionService.js';
import { modules } from '../registry/index.js';

const router = express.Router();

const KPIS = [
  { key: 'farmers', label: 'Registered Farmers', model: 'Farmer', permission: 'cane:farmer:view', kind: 'count', icon: 'sprout' },
  { key: 'caneCrushedMt', label: 'Cane Crushed (MT)', model: 'ShiftProduction', field: 'caneCrushedMt', permission: 'production:shiftProduction:view', kind: 'sum', icon: 'sprout' },
  { key: 'sugarProducedMt', label: 'Sugar Produced (MT)', model: 'ShiftProduction', field: 'sugarProducedMt', permission: 'production:shiftProduction:view', kind: 'sum', icon: 'box' },
  { key: 'openPurchaseOrders', label: 'Open Purchase Orders', model: 'PurchaseOrder', permission: 'procurement:purchaseOrder:view', kind: 'count', match: { status: { $in: ['draft', 'submitted', 'approved'] } }, icon: 'cart' },
  { key: 'openSalesOrders', label: 'Open Sales Orders', model: 'SalesOrder', permission: 'sales:salesOrder:view', kind: 'count', match: { status: { $in: ['draft', 'submitted', 'approved'] } }, icon: 'truck' },
  { key: 'unpaidInvoices', label: 'Unpaid Invoices', model: 'SalesInvoice', permission: 'sales:salesInvoice:view', kind: 'count', match: { paymentStatus: { $in: ['unpaid', 'partial', 'overdue'] } }, icon: 'wallet' },
  { key: 'employees', label: 'Employees', model: 'Employee', permission: 'hr:employee:view', kind: 'count', match: { status: 'active' }, icon: 'users' },
  { key: 'openBreakdowns', label: 'Open Breakdowns', model: 'BreakdownMaintenance', permission: 'maintenance:breakdownMaintenance:view', kind: 'count', match: { status: { $in: ['open', 'attending'] } }, icon: 'wrench' },
  { key: 'openNcr', label: 'Open Non-Conformances', model: 'NonConformance', permission: 'quality:nonConformance:view', kind: 'count', match: { status: { $in: ['open', 'investigating'] } }, icon: 'flask' },
  { key: 'pendingCanePayments', label: 'Pending Cane Payments', model: 'CanePayment', permission: 'cane:canePayment:view', kind: 'count', match: { status: 'pending' }, icon: 'wallet' },
];

/**
 * Dashboard payload. Each card and chart is included only when the caller holds
 * the matching permission, so a store keeper never sees finance totals.
 */
router.get(
  '/dashboard',
  authenticate,
  asyncHandler(async (req, res) => {
    const permissions = req.auth.permissions;

    const kpis = [];
    for (const kpi of KPIS) {
      if (!hasPermission(permissions, kpi.permission)) continue;
      const value = kpi.kind === 'count'
        ? await analytics.count(kpi.model, kpi.match || {})
        : await analytics.sum(kpi.model, kpi.field, kpi.match || {});
      kpis.push({ key: kpi.key, label: kpi.label, value, icon: kpi.icon });
    }

    const production = hasPermission(permissions, 'production:shiftProduction:view')
      ? await analytics.productionSnapshot()
      : null;

    const caneTrend = hasPermission(permissions, 'production:shiftProduction:view')
      ? await analytics.dailyTrend('ShiftProduction', 'productionDate', 'caneCrushedMt', 14)
      : [];

    const sugarTrend = hasPermission(permissions, 'production:shiftProduction:view')
      ? await analytics.dailyTrend('ShiftProduction', 'productionDate', 'sugarProducedMt', 14)
      : [];

    const salesByGrade = hasPermission(permissions, 'sales:salesInvoice:view')
      ? await analytics.groupSum('SalesInvoice', 'grade', 'grandTotal', { limit: 8 })
      : [];

    const purchasesByVendor = hasPermission(permissions, 'procurement:purchaseOrder:view')
      ? await analytics.groupSum('PurchaseOrder', 'supplier', 'totalAmount', {
        limit: 8,
        ref: { collection: 'suppliers', field: 'name' },
      })
      : [];

    const stock = hasPermission(permissions, 'stores:stockLedger:view')
      ? await analytics.stockOnHand(10)
      : [];

    const recentActivity = hasPermission(permissions, 'access:activityLog:view')
      ? await analytics.model('ActivityLog').find().sort('-createdAt').limit(8).lean()
      : [];

    return ok(res, {
      kpis,
      production,
      charts: { caneTrend, sugarTrend, salesByGrade, purchasesByVendor, stock },
      recentActivity,
    });
  }),
);

/** Module health summary: record counts per visible submodule. */
router.get(
  '/overview',
  authenticate,
  asyncHandler(async (req, res) => {
    const permissions = req.auth.permissions;
    const summary = [];

    for (const moduleDef of modules) {
      const submodules = [];
      for (const submodule of moduleDef.submodules) {
        if (!hasPermission(permissions, `${moduleDef.key}:${submodule.key}:view`)) continue;
        const name = submodule.key.charAt(0).toUpperCase() + submodule.key.slice(1);
        submodules.push({ key: submodule.key, name: submodule.name, total: await analytics.count(name) });
      }
      if (submodules.length) {
        summary.push({
          module: moduleDef.key,
          name: moduleDef.name,
          icon: moduleDef.icon,
          total: submodules.reduce((acc, item) => acc + item.total, 0),
          submodules,
        });
      }
    }

    return ok(res, summary);
  }),
);

export default router;
