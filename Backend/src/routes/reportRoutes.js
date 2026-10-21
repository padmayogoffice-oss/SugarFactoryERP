/**
 * Report routes. Each report page key maps to a handler in reportService and is
 * gated by the permission declared for that page in the module registry, so
 * adding a report page automatically secures its endpoint.
 */
import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';

import { ok } from '../utils/apiResponse.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import * as reportService from '../services/reportService.js';
import { getModule } from '../registry/index.js';
import { hasPermission } from '../services/permissionService.js';

const router = express.Router();

const REPORTS = {
  caneReport: reportService.caneReport,
  productionReport: reportService.productionReport,
  inventoryReport: reportService.inventoryReport,
  purchaseReport: reportService.purchaseReport,
  salesReport: reportService.salesReport,
  financeReport: reportService.financeReport,
  payrollReport: reportService.payrollReport,
  qualityReport: reportService.qualityReport,
  maintenanceReport: reportService.maintenanceReport,
  statutoryRegister: reportService.statutoryRegister,
};

const FINANCE_STATEMENTS = {
  trialBalance: reportService.trialBalance,
  profitAndLoss: reportService.profitAndLoss,
  balanceSheet: reportService.balanceSheet,
  dayBook: reportService.dayBook,
};

// Each report page is gated by the permission declared in the module registry.
for (const [key, handler] of Object.entries(REPORTS)) {
  router.get(`/${key}`, authenticate, authorize(`reports:${key}:view`), asyncHandler(async (req, res) => ok(res, await handler(req.query))));
}

for (const [key, handler] of Object.entries(FINANCE_STATEMENTS)) {
  router.get(`/${key}`, authenticate, authorize(`finance:${key}:view`), asyncHandler(async (req, res) => ok(res, await handler(req.query))));
}

/** Metadata for the report pages the caller can open, used by the frontend. */
router.get('/meta', authenticate, asyncHandler(async (req, res) => {
  const permissions = req.auth.permissions;
  const reportsModule = getModule('reports');
  const financeModule = getModule('finance');

  const pages = [
    ...reportsModule.pages.map((page) => ({ module: 'reports', ...page, permission: `reports:${page.key}:view` })),
    ...financeModule.pages.map((page) => ({ module: 'finance', ...page, permission: `finance:${page.key}:view` })),
  ].filter((page) => hasPermission(permissions, page.permission));

  return ok(res, pages);
}));

export default router;
