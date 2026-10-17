const { f, FIELD_TYPES: T } = require('../fields');
const { sub, mod } = require('../helpers');
const { STATUS, SEASON, GENDERS, PAYMENT_MODES } = require('../constants');

const notes = f('remarks', 'Remarks', T.TEXT, { inList: false });

const organization = mod('organization', 'Organization & Registration', {
  icon: 'building',
  order: 1,
  description: 'Register sugar factory units, departments, warehouses and financial years.',
  submodules: [
    sub('factoryRegistration', 'Factory Registration', [
      f('code', 'Registration Code', T.STRING, { required: true, unique: true }),
      f('name', 'Factory Name', T.STRING, { required: true }),
      f('legalEntity', 'Legal Entity Name', T.STRING, { required: true }),
      f('registrationNo', 'Registration Number', T.STRING, { required: true }),
      f('gstin', 'GSTIN', T.STRING, { required: true }),
      f('pan', 'PAN', T.STRING, { required: true }),
      f('licenseNo', 'Industry License No', T.STRING),
      f('crushingCapacityTcd', 'Crushing Capacity', T.NUMBER, { unit: 'TCD', required: true }),
      f('season', 'Operating Season', T.SELECT, { options: SEASON, required: true }),
      f('registeredOn', 'Registered On', T.DATE, { required: true }),
      f('addressLine1', 'Address Line 1', T.STRING, { required: true }),
      f('addressLine2', 'Address Line 2', T.STRING),
      f('village', 'Village / Town', T.STRING),
      f('district', 'District', T.STRING, { required: true }),
      f('state', 'State', T.STRING, { required: true }),
      f('pincode', 'PIN Code', T.STRING),
      f('contactPerson', 'Contact Person', T.STRING, { required: true }),
      f('contactPhone', 'Contact Phone', T.PHONE, { required: true }),
      f('contactEmail', 'Contact Email', T.EMAIL),
      f('website', 'Website', T.STRING, { inList: false }),
      f('status', 'Status', T.SELECT, { options: STATUS, default: 'active' }),
      notes,
    ], { description: 'Statutory registration details of each sugar factory unit.', labelField: 'name' }),

    sub('factory', 'Factory Units', [
      f('code', 'Unit Code', T.STRING, { required: true, unique: true }),
      f('name', 'Unit Name', T.STRING, { required: true }),
      f('unitType', 'Unit Type', T.SELECT, { options: ['Sugar', 'Distillery', 'Cogeneration', 'Refinery'], required: true }),
      f('parentFactory', 'Parent Factory', T.REF, { ref: 'FactoryRegistration', refLabel: 'name' }),
      f('location', 'Location', T.STRING),
      f('capacityTcd', 'Capacity', T.NUMBER, { unit: 'TCD' }),
      f('commissionedOn', 'Commissioned On', T.DATE),
      f('status', 'Status', T.SELECT, { options: STATUS, default: 'active' }),
      notes,
    ], { description: 'Individual plant units under the registered factory.' }),

    sub('department', 'Departments', [
      f('code', 'Department Code', T.STRING, { required: true, unique: true }),
      f('name', 'Department Name', T.STRING, { required: true }),
      f('category', 'Category', T.SELECT, {
        options: ['Cane', 'Production', 'Quality', 'Stores', 'Finance', 'HR', 'Sales', 'Maintenance', 'Administration'],
        required: true,
      }),
      f('head', 'Department Head', T.STRING),
      f('costCenter', 'Cost Center', T.STRING),
      f('status', 'Status', T.SELECT, { options: STATUS, default: 'active' }),
      notes,
    ], { description: 'Organisation departments used for costing and approvals.' }),

    sub('designation', 'Designations', [
      f('code', 'Designation Code', T.STRING, { required: true, unique: true }),
      f('name', 'Designation', T.STRING, { required: true }),
      f('grade', 'Grade', T.SELECT, { options: ['M1', 'M2', 'M3', 'E1', 'E2', 'E3', 'E4', 'Workman', 'Staff'] }),
      f('department', 'Department', T.REF, { ref: 'Department', refLabel: 'name' }),
      f('status', 'Status', T.SELECT, { options: STATUS, default: 'active' }),
      notes,
    ], { description: 'Job titles mapped to departments and grades.' }),

    sub('warehouse', 'Warehouses & Yards', [
      f('code', 'Warehouse Code', T.STRING, { required: true, unique: true }),
      f('name', 'Warehouse Name', T.STRING, { required: true }),
      f('warehouseType', 'Type', T.SELECT, {
        options: ['Store', 'Sugar Godown', 'Molasses Tank', 'Bagasse Yard', 'Chemical Store', 'Spare Parts Store'],
        required: true,
      }),
      f('factoryUnit', 'Factory Unit', T.REF, { ref: 'Factory', refLabel: 'name' }),
      f('location', 'Location', T.STRING),
      f('capacityMt', 'Storage Capacity', T.NUMBER, { unit: 'MT' }),
      f('incharge', 'In-charge', T.STRING),
      f('status', 'Status', T.SELECT, { options: STATUS, default: 'active' }),
      notes,
    ], { description: 'Stores, godowns and yards that hold stock.' }),

    sub('costCenter', 'Cost Centers', [
      f('code', 'Cost Center Code', T.STRING, { required: true, unique: true }),
      f('name', 'Cost Center', T.STRING, { required: true }),
      f('type', 'Type', T.SELECT, { options: ['Production', 'Service', 'Administrative', 'Selling'], required: true }),
      f('department', 'Department', T.REF, { ref: 'Department', refLabel: 'name' }),
      f('budget', 'Annual Budget', T.CURRENCY),
      f('status', 'Status', T.SELECT, { options: STATUS, default: 'active' }),
      notes,
    ], { description: 'Cost centers used for expense allocation.' }),

    sub('financialYear', 'Financial Years', [
      f('code', 'FY Code', T.STRING, { required: true, unique: true, placeholder: '2025-26' }),
      f('startDate', 'Start Date', T.DATE, { required: true }),
      f('endDate', 'End Date', T.DATE, { required: true }),
      f('season', 'Season', T.SELECT, { options: SEASON, required: true }),
      f('isCurrent', 'Current Year', T.BOOLEAN, { default: false }),
      f('isClosed', 'Closed', T.BOOLEAN, { default: false }),
      notes,
    ], { description: 'Accounting periods and crushing seasons.' }),
  ],
});

const access = mod('access', 'Users & Access Control', {
  icon: 'shield',
  order: 2,
  description: 'Role based access control: users, roles and permission assignment.',
  submodules: [
    sub('user', 'Users', [
      f('employeeCode', 'Employee Code', T.STRING, { required: true, unique: true }),
      f('firstName', 'First Name', T.STRING, { required: true }),
      f('lastName', 'Last Name', T.STRING),
      f('email', 'Email', T.EMAIL, { required: true, unique: true }),
      f('phone', 'Phone', T.PHONE),
      f('gender', 'Gender', T.SELECT, { options: GENDERS }),
      f('department', 'Department', T.REF, { ref: 'Department', refLabel: 'name' }),
      f('designation', 'Designation', T.REF, { ref: 'Designation', refLabel: 'name' }),
      f('roles', 'Roles', T.REFS, { ref: 'Role', refLabel: 'name' }),
      f('status', 'Status', T.SELECT, { options: STATUS, default: 'active' }),
      notes,
    ], { description: 'Application users and their role assignments.' }),

    sub('role', 'Roles', [
      f('code', 'Role Code', T.STRING, { required: true, unique: true }),
      f('name', 'Role Name', T.STRING, { required: true }),
      f('description', 'Description', T.TEXT),
      f('permissions', 'Permissions', T.TAGS, { inForm: false, inList: false }),
      f('isSystem', 'System Role', T.BOOLEAN, { default: false, readOnly: true }),
      f('status', 'Status', T.SELECT, { options: STATUS, default: 'active' }),
    ], { description: 'Roles bundle permissions; assign roles to users.' }),
  ],
  pages: [
    { key: 'permission', name: 'Permission Catalog', icon: 'key', description: 'Full list of available permissions.' },
    { key: 'activityLog', name: 'Activity Log', icon: 'history', description: 'Audit trail of user actions.' },
  ],
});

const masters = mod('masters', 'Master Data', {
  icon: 'database',
  order: 3,
  description: 'Shared master data: items, business partners, vehicles and taxes.',
  submodules: [
    sub('item', 'Item Master', [
      f('code', 'Item Code', T.STRING, { required: true, unique: true }),
      f('name', 'Item Name', T.STRING, { required: true }),
      f('category', 'Category', T.SELECT, {
        options: ['Raw Material', 'Chemical', 'Spare Part', 'Consumable', 'Packing Material', 'Finished Goods', 'By-Product', 'Fuel'],
        required: true,
      }),
      f('uom', 'Unit of Measure', T.SELECT, { options: ['MT', 'Quintal', 'Kg', 'Litre', 'KL', 'Nos', 'Bag', 'Box', 'Bundle', 'Meter'], required: true }),
      f('hsnCode', 'HSN Code', T.STRING),
      f('gstRate', 'GST Rate', T.PERCENT, { options: [0, 5, 12, 18, 28], default: 18 }),
      f('reorderLevel', 'Reorder Level', T.NUMBER),
      f('openingStock', 'Opening Stock', T.NUMBER, { default: 0 }),
      f('openingRate', 'Opening Rate', T.CURRENCY, { default: 0 }),
      f('isStocked', 'Stocked Item', T.BOOLEAN, { default: true }),
      f('status', 'Status', T.SELECT, { options: STATUS, default: 'active' }),
      notes,
    ], { description: 'Unified item master covering raw material, spares and finished goods.' }),

    sub('uom', 'Units of Measure', [
      f('code', 'UOM Code', T.STRING, { required: true, unique: true }),
      f('name', 'UOM Name', T.STRING, { required: true }),
      f('baseUom', 'Base UOM', T.STRING),
      f('conversionFactor', 'Conversion Factor', T.NUMBER, { default: 1 }),
      f('status', 'Status', T.SELECT, { options: STATUS, default: 'active' }),
    ], { description: 'Units and their conversion factors.' }),

    sub('supplier', 'Suppliers / Vendors', [
      f('code', 'Vendor Code', T.STRING, { required: true, unique: true }),
      f('name', 'Vendor Name', T.STRING, { required: true }),
      f('vendorType', 'Vendor Type', T.SELECT, { options: ['Raw Material', 'Chemical', 'Spare Parts', 'Services', 'Transport', 'Packing Material'], required: true }),
      f('gstin', 'GSTIN', T.STRING),
      f('pan', 'PAN', T.STRING),
      f('contactPerson', 'Contact Person', T.STRING),
      f('phone', 'Phone', T.PHONE, { required: true }),
      f('email', 'Email', T.EMAIL),
      f('address', 'Address', T.TEXT),
      f('city', 'City', T.STRING),
      f('state', 'State', T.STRING),
      f('creditDays', 'Credit Days', T.NUMBER, { default: 30 }),
      f('creditLimit', 'Credit Limit', T.CURRENCY, { default: 0 }),
      f('bankName', 'Bank Name', T.STRING),
      f('accountNo', 'Account Number', T.STRING, { inList: false }),
      f('ifsc', 'IFSC Code', T.STRING, { inList: false }),
      f('status', 'Status', T.SELECT, { options: STATUS, default: 'active' }),
      notes,
    ], { description: 'Approved vendors for procurement.' }),

    sub('customer', 'Customers', [
      f('code', 'Customer Code', T.STRING, { required: true, unique: true }),
      f('name', 'Customer Name', T.STRING, { required: true }),
      f('customerType', 'Customer Type', T.SELECT, {
        options: ['Trader', 'Distributor', 'Institution', 'Retailer', 'Exporter', 'Government'],
        required: true,
      }),
      f('gstin', 'GSTIN', T.STRING),
      f('pan', 'PAN', T.STRING),
      f('contactPerson', 'Contact Person', T.STRING),
      f('phone', 'Phone', T.PHONE, { required: true }),
      f('email', 'Email', T.EMAIL),
      f('billingAddress', 'Billing Address', T.TEXT),
      f('city', 'City', T.STRING),
      f('state', 'State', T.STRING),
      f('creditDays', 'Credit Days', T.NUMBER, { default: 30 }),
      f('creditLimit', 'Credit Limit', T.CURRENCY, { default: 0 }),
      f('priceList', 'Default Price List', T.STRING),
      f('status', 'Status', T.SELECT, { options: STATUS, default: 'active' }),
      notes,
    ], { description: 'Sugar and by-product buyers.' }),

    sub('transporter', 'Transporters', [
      f('code', 'Transporter Code', T.STRING, { required: true, unique: true }),
      f('name', 'Transporter Name', T.STRING, { required: true }),
      f('contactPerson', 'Contact Person', T.STRING),
      f('phone', 'Phone', T.PHONE, { required: true }),
      f('gstin', 'GSTIN', T.STRING),
      f('address', 'Address', T.TEXT),
      f('freightBasis', 'Freight Basis', T.SELECT, { options: ['Per MT', 'Per Trip', 'Per KM', 'Lumpsum'] }),
      f('status', 'Status', T.SELECT, { options: STATUS, default: 'active' }),
      notes,
    ], { description: 'Transport partners for cane and finished goods movement.' }),

    sub('vehicle', 'Vehicles', [
      f('vehicleNo', 'Vehicle Number', T.STRING, { required: true, unique: true }),
      f('vehicleType', 'Vehicle Type', T.SELECT, { options: ['Truck', 'Tractor Trolley', 'Container', 'Tempo', 'Bullock Cart'], required: true }),
      f('capacityMt', 'Capacity', T.NUMBER, { unit: 'MT' }),
      f('ownerType', 'Ownership', T.SELECT, { options: ['Own', 'Hired', 'Transporter'], required: true }),
      f('ownerName', 'Owner Name', T.STRING),
      f('transporter', 'Transporter', T.REF, { ref: 'Transporter', refLabel: 'name' }),
      f('driverName', 'Driver Name', T.STRING),
      f('driverPhone', 'Driver Phone', T.PHONE),
      f('fitnessValidUpto', 'Fitness Valid Upto', T.DATE),
      f('insuranceValidUpto', 'Insurance Valid Upto', T.DATE),
      f('status', 'Status', T.SELECT, { options: STATUS, default: 'active' }),
      notes,
    ], { description: 'Fleet and hired vehicles used for dispatch and cane haulage.' }),

    sub('bank', 'Banks', [
      f('code', 'Bank Code', T.STRING, { required: true, unique: true }),
      f('name', 'Bank Name', T.STRING, { required: true }),
      f('branch', 'Branch', T.STRING),
      f('accountNo', 'Account Number', T.STRING, { required: true, unique: true }),
      f('ifsc', 'IFSC Code', T.STRING, { required: true }),
      f('accountType', 'Account Type', T.SELECT, { options: ['Current', 'Savings', 'OD', 'CC'], default: 'Current' }),
      f('openingBalance', 'Opening Balance', T.CURRENCY, { default: 0 }),
      f('status', 'Status', T.SELECT, { options: STATUS, default: 'active' }),
      notes,
    ], { description: 'Company bank accounts for payments and reconciliation.' }),

    sub('taxRate', 'Tax / GST Rates', [
      f('code', 'Tax Code', T.STRING, { required: true, unique: true }),
      f('name', 'Tax Name', T.STRING, { required: true }),
      f('taxType', 'Tax Type', T.SELECT, { options: ['GST', 'TDS', 'TCS', 'VAT', 'Excise', 'Cess'], required: true }),
      f('ratePercent', 'Rate', T.PERCENT, { required: true }),
      f('effectiveFrom', 'Effective From', T.DATE, { required: true }),
      f('effectiveTo', 'Effective To', T.DATE),
      f('status', 'Status', T.SELECT, { options: STATUS, default: 'active' }),
      notes,
    ], { description: 'Tax rates applied on purchase and sales documents.' }),

    sub('paymentTerm', 'Payment Terms', [
      f('code', 'Term Code', T.STRING, { required: true, unique: true }),
      f('name', 'Term Name', T.STRING, { required: true }),
      f('dueDays', 'Due Days', T.NUMBER, { required: true, default: 30 }),
      f('discountPercent', 'Early Payment Discount', T.PERCENT, { default: 0 }),
      f('mode', 'Preferred Mode', T.SELECT, { options: PAYMENT_MODES }),
      f('status', 'Status', T.SELECT, { options: STATUS, default: 'active' }),
      notes,
    ], { description: 'Reusable credit and payment terms.' }),
  ],
});

const settings = mod('settings', 'System Settings', {
  icon: 'settings',
  order: 90,
  description: 'Company preferences, document numbering and audit configuration.',
  submodules: [
    sub('companySetting', 'Company Settings', [
      f('companyName', 'Company Name', T.STRING, { required: true }),
      f('legalName', 'Legal Name', T.STRING),
      f('gstin', 'GSTIN', T.STRING),
      f('pan', 'PAN', T.STRING),
      f('address', 'Registered Address', T.TEXT),
      f('phone', 'Phone', T.PHONE),
      f('email', 'Email', T.EMAIL),
      f('website', 'Website', T.STRING),
      f('currency', 'Currency', T.SELECT, { options: ['INR', 'USD', 'EUR'], default: 'INR' }),
      f('financialYearStart', 'Financial Year Start', T.SELECT, { options: ['April', 'January'], default: 'April' }),
      f('timezone', 'Timezone', T.SELECT, { options: ['Asia/Kolkata', 'UTC'], default: 'Asia/Kolkata' }),
      f('logoUrl', 'Logo URL', T.STRING, { inList: false }),
      notes,
    ], { description: 'Organisation-wide defaults used across the ERP.' }),

    sub('documentNumbering', 'Document Numbering', [
      f('code', 'Sequence Code', T.STRING, { required: true, unique: true }),
      f('name', 'Document Type', T.STRING, { required: true }),
      f('prefix', 'Prefix', T.STRING, { required: true }),
      f('suffix', 'Suffix', T.STRING),
      f('padding', 'Number Padding', T.NUMBER, { default: 5 }),
      f('includeYear', 'Include Financial Year', T.BOOLEAN, { default: true }),
      f('lastNumber', 'Last Number Used', T.NUMBER, { default: 0, readOnly: true }),
      f('status', 'Status', T.SELECT, { options: STATUS, default: 'active' }),
    ], { description: 'Auto-numbering rules for vouchers and documents.' }),

    sub('integration', 'Integrations', [
      f('name', 'Integration', T.STRING, { required: true }),
      f('provider', 'Provider', T.SELECT, { options: ['Razorpay', 'Tally', 'SMS Gateway', 'WhatsApp', 'Email SMTP', 'Weighbridge', 'GPS'], required: true }),
      f('endpoint', 'Endpoint URL', T.STRING),
      f('apiKey', 'API Key', T.STRING, { inList: false }),
      f('isEnabled', 'Enabled', T.BOOLEAN, { default: false }),
      f('lastSyncAt', 'Last Sync', T.DATE, { readOnly: true }),
      notes,
    ], { description: 'External system connections (payments, SMS, weighbridge, Tally).' }),

    sub('notificationTemplate', 'Notification Templates', [
      f('code', 'Template Code', T.STRING, { required: true, unique: true }),
      f('name', 'Template Name', T.STRING, { required: true }),
      f('channel', 'Channel', T.SELECT, { options: ['Email', 'SMS', 'WhatsApp', 'In-App'], required: true }),
      f('event', 'Trigger Event', T.STRING, { required: true }),
      f('subject', 'Subject', T.STRING),
      f('body', 'Body', T.TEXT, { inList: false }),
      f('status', 'Status', T.SELECT, { options: STATUS, default: 'active' }),
    ], { description: 'Reusable message templates for system notifications.' }),
  ],
});

module.exports = [organization, access, masters, settings];
