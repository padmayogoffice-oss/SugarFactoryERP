const express = require('express');
const asyncHandler = require('../utils/asyncHandler');

const { ok } = require('../utils/apiResponse');
const { authenticate, authorize } = require('../middleware/auth');
const reportService = require('../services/reportService');
const { getModule } = require('../registry');

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
  const { hasPermission } = require('../services/permissionService');
  const reportsModule = getModule('reports');
  const financeModule = getModule('finance');

  const pages = [
    ...reportsModule.pages.map((page) => ({ module: 'reports', ...page, permission: `reports:${page.key}:view` })),
    ...financeModule.pages.map((page) => ({ module: 'finance', ...page, permission: `finance:${page.key}:view` })),
  ].filter((page) => hasPermission(permissions, page.permission));

  return ok(res, pages);
}));

module.exports = router;
