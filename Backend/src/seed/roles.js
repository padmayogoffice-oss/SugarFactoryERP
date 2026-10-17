const { permissionCatalog, modules } = require('../registry');

/**
 * Role templates. Permissions are expressed as `<module>:<submodule>:<action>`
 * with `*` allowed for the submodule or action segment.
 */
const ROLE_TEMPLATES = [
  {
    code: 'SUPER_ADMIN',
    name: 'Super Admin',
    description: 'Unrestricted access to every module, page and action.',
    isSystem: true,
    permissions: ['*'],
  },
  {
    code: 'FACTORY_ADMIN',
    name: 'Factory Administrator',
    description: 'Full operational access except role and user administration.',
    isSystem: true,
    permissions: ['*:*:view', '*:*:create', '*:*:update', 'access:user:view', 'access:role:view', 'access:activityLog:view'],
  },
  {
    code: 'PRODUCTION_MANAGER',
    name: 'Production Manager',
    description: 'Crushing, shift production, juice analysis and bagging.',
    isSystem: false,
    permissions: [
      'production:*:*', 'cane:*:view', 'cane:caneWeighment:view', 'cane:caneQuality:*',
      'quality:*:*', 'maintenance:*:*', 'stores:*:view', 'reports:productionReport:view',
      'reports:caneReport:view', 'reports:qualityReport:view', 'reports:maintenanceReport:view',
      'masters:item:view', 'masters:uom:view', 'organization:*:view',
    ],
  },
  {
    code: 'CANE_MANAGER',
    name: 'Cane Manager',
    description: 'Farmer registration, contracts, indents, weighment and cane payments.',
    isSystem: false,
    permissions: [
      'cane:*:*', 'masters:vehicle:*', 'masters:transporter:*', 'masters:item:view',
      'finance:paymentVoucher:view', 'reports:caneReport:view', 'organization:*:view',
      'quality:caneQuality:*',
    ],
  },
  {
    code: 'PURCHASE_MANAGER',
    name: 'Purchase Manager',
    description: 'Requisitions, quotations, purchase orders, GRN and vendor returns.',
    isSystem: false,
    permissions: [
      'procurement:*:*', 'masters:supplier:*', 'masters:item:*', 'masters:taxRate:view',
      'masters:paymentTerm:*', 'stores:*:view', 'quality:qualitySpecification:view',
      'quality:labTest:view', 'reports:purchaseReport:view', 'reports:inventoryReport:view',
    ],
  },
  {
    code: 'STORE_KEEPER',
    name: 'Store Keeper',
    description: 'Stock ledger, material issue, transfer and physical verification.',
    isSystem: false,
    permissions: [
      'stores:*:*', 'masters:item:view', 'masters:uom:view', 'masters:warehouse:view',
      'procurement:goodsReceipt:*', 'procurement:purchaseOrder:view', 'reports:inventoryReport:view',
      'organization:warehouse:view',
    ],
  },
  {
    code: 'SALES_MANAGER',
    name: 'Sales Manager',
    description: 'Customer orders, release, dispatch, invoicing and collections.',
    isSystem: false,
    permissions: [
      'sales:*:*', 'masters:customer:*', 'masters:item:view', 'masters:taxRate:view',
      'masters:paymentTerm:*', 'masters:transporter:view', 'stores:*:view',
      'reports:salesReport:view', 'reports:statutoryRegister:view',
    ],
  },
  {
    code: 'FINANCE_MANAGER',
    name: 'Finance Manager',
    description: 'Accounts, vouchers, ledgers, payments, budgets and statements.',
    isSystem: false,
    permissions: [
      'finance:*:*', 'sales:salesInvoice:*', 'sales:customerLedger:*', 'sales:customerReceipt:*',
      'procurement:purchaseOrder:view', 'procurement:goodsReceipt:view', 'hr:payrollRun:*',
      'hr:statutoryCompliance:*', 'masters:bank:*', 'masters:taxRate:*',
      'reports:financeReport:view', 'reports:payrollReport:view', 'reports:salesReport:view',
      'reports:purchaseReport:view', 'reports:statutoryRegister:view',
    ],
  },
  {
    code: 'HR_MANAGER',
    name: 'HR Manager',
    description: 'Employee master, attendance, leave, shifts and payroll.',
    isSystem: false,
    permissions: [
      'hr:*:*', 'organization:department:view', 'organization:designation:view',
      'reports:payrollReport:view', 'access:user:view',
    ],
  },
  {
    code: 'QUALITY_ANALYST',
    name: 'Quality Analyst',
    description: 'Lab testing, sample collection, COA and non-conformance.',
    isSystem: false,
    permissions: [
      'quality:*:*', 'cane:caneQuality:*', 'production:juiceAnalysis:*',
      'reports:qualityReport:view', 'masters:item:view',
    ],
  },
  {
    code: 'MAINTENANCE_ENGINEER',
    name: 'Maintenance Engineer',
    description: 'Equipment register, preventive and breakdown maintenance.',
    isSystem: false,
    permissions: [
      'maintenance:*:*', 'stores:materialIssue:view', 'stores:spareConsumption:*',
      'reports:maintenanceReport:view', 'masters:item:view', 'organization:*:view',
    ],
  },
  {
    code: 'AUDITOR',
    name: 'Auditor',
    description: 'Read-only access across all modules plus the activity log.',
    isSystem: false,
    permissions: ['*:*:view', 'access:activityLog:view', 'access:permission:view'],
  },
  {
    code: 'REPORT_VIEWER',
    name: 'Report Viewer',
    description: 'Read-only access to reports and analytics only.',
    isSystem: false,
    permissions: modules
      .filter((moduleDef) => moduleDef.key === 'reports')
      .flatMap((moduleDef) => moduleDef.pages.map((page) => `reports:${page.key}:view`))
      .concat(['finance:trialBalance:view', 'finance:profitAndLoss:view', 'finance:balanceSheet:view', 'finance:dayBook:view']),
  },
];

/** Expands wildcard templates into concrete permission keys for validation. */
function expandPermissions(permissions) {

  const expanded = new Set();

  for (const permission of permissions) {
    if (permission === '*') return ['*'];
    const [moduleKey, submoduleKey, action] = permission.split(':');

    for (const entry of permissionCatalog) {
      if (moduleKey !== '*' && entry.module !== moduleKey) continue;
      if (submoduleKey !== '*' && entry.submodule !== submoduleKey) continue;
      if (action !== '*' && entry.action !== action) continue;
      expanded.add(entry.key);
    }
  }

  return [...expanded];
}

module.exports = { ROLE_TEMPLATES, expandPermissions };
