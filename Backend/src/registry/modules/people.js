/**
 * People registry modules: Human Resources & Payroll and Reports & Analytics.
 *
 * `reports` declares report-style pages only (no submodules); each page key maps
 * to a handler in services/reportService.js and renders generically on the client.
 */
const { f, FIELD_TYPES: T } = require('../fields');
const { sub, mod } = require('../helpers');
const { STATUS, GENDERS, PAYMENT_MODES, SHIFTS } = require('../constants');

const notes = f('remarks', 'Remarks', T.TEXT, { inList: false });

const hr = mod('hr', 'Human Resources & Payroll', {
  icon: 'users',
  order: 12,
  description: 'Employee master, attendance, leave, shifts, payroll and statutory compliance.',
  submodules: [
    sub('employee', 'Employee Master', [
      f('employeeCode', 'Employee Code', T.STRING, { required: true, unique: true }),
      f('firstName', 'First Name', T.STRING, { required: true }),
      f('lastName', 'Last Name', T.STRING),
      f('fatherName', 'Father / Spouse Name', T.STRING),
      f('gender', 'Gender', T.SELECT, { options: GENDERS, required: true }),
      f('dateOfBirth', 'Date of Birth', T.DATE),
      f('mobile', 'Mobile', T.PHONE, { required: true }),
      f('email', 'Email', T.EMAIL),
      f('aadhaarNo', 'Aadhaar Number', T.STRING),
      f('panNo', 'PAN', T.STRING),
      f('department', 'Department', T.REF, { ref: 'Department', refLabel: 'name', required: true }),
      f('designation', 'Designation', T.REF, { ref: 'Designation', refLabel: 'name', required: true }),
      f('dateOfJoining', 'Date of Joining', T.DATE, { required: true }),
      f('employmentType', 'Employment Type', T.SELECT, { options: ['Permanent', 'Contract', 'Seasonal', 'Apprentice', 'Daily Wage'], required: true }),
      f('shift', 'Default Shift', T.SELECT, { options: SHIFTS }),
      f('basicSalary', 'Basic Salary', T.CURRENCY, { required: true }),
      f('bankName', 'Bank Name', T.STRING),
      f('accountNo', 'Account Number', T.STRING, { inList: false }),
      f('ifsc', 'IFSC Code', T.STRING, { inList: false }),
      f('pfNo', 'PF Number', T.STRING, { inList: false }),
      f('esiNo', 'ESI Number', T.STRING, { inList: false }),
      f('status', 'Status', T.SELECT, { options: ['active', 'on-leave', 'suspended', 'resigned', 'retired', 'terminated'], default: 'active' }),
      notes,
    ], { description: 'Employee personal, statutory and salary details.', labelField: 'employeeCode' }),

    sub('attendance', 'Attendance', [
      f('attendanceDate', 'Attendance Date', T.DATE, { required: true }),
      f('employee', 'Employee', T.REF, { ref: 'Employee', refLabel: 'employeeCode', required: true }),
      f('shift', 'Shift', T.SELECT, { options: SHIFTS }),
      f('status', 'Attendance Status', T.SELECT, { options: ['Present', 'Absent', 'Half Day', 'Weekly Off', 'Holiday', 'Paid Leave', 'Unpaid Leave', 'On Duty'], required: true }),
      f('inTime', 'In Time', T.STRING),
      f('outTime', 'Out Time', T.STRING),
      f('workedHours', 'Worked Hours', T.NUMBER, { unit: 'Hours' }),
      f('overtimeHours', 'Overtime Hours', T.NUMBER, { unit: 'Hours', default: 0 }),
      f('department', 'Department', T.REF, { ref: 'Department', refLabel: 'name' }),
      notes,
    ], { description: 'Daily attendance and overtime register.' }),

    sub('leaveType', 'Leave Types', [
      f('code', 'Leave Code', T.STRING, { required: true, unique: true }),
      f('name', 'Leave Type', T.STRING, { required: true }),
      f('annualQuota', 'Annual Quota', T.NUMBER, { required: true }),
      f('isPaid', 'Paid Leave', T.BOOLEAN, { default: true }),
      f('carryForward', 'Carry Forward', T.BOOLEAN, { default: false }),
      f('status', 'Status', T.SELECT, { options: STATUS, default: 'active' }),
    ], { description: 'Leave categories and entitlement rules.' }),

    sub('leaveRequest', 'Leave Requests', [
      f('requestNo', 'Request Number', T.STRING, { required: true, unique: true }),
      f('employee', 'Employee', T.REF, { ref: 'Employee', refLabel: 'employeeCode', required: true }),
      f('leaveType', 'Leave Type', T.REF, { ref: 'LeaveType', refLabel: 'name', required: true }),
      f('fromDate', 'From Date', T.DATE, { required: true }),
      f('toDate', 'To Date', T.DATE, { required: true }),
      f('days', 'Number of Days', T.NUMBER, { required: true }),
      f('reason', 'Reason', T.TEXT),
      f('approvedBy', 'Approved By', T.STRING, { readOnly: true }),
      f('status', 'Status', T.SELECT, { options: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' }),
      notes,
    ], { description: 'Leave applications and approval workflow.' }),

    sub('shiftSchedule', 'Shift Schedule', [
      f('scheduleNo', 'Schedule Number', T.STRING, { required: true, unique: true }),
      f('scheduleDate', 'Schedule Date', T.DATE, { required: true }),
      f('employee', 'Employee', T.REF, { ref: 'Employee', refLabel: 'employeeCode', required: true }),
      f('shift', 'Shift', T.SELECT, { options: SHIFTS, required: true }),
      f('department', 'Department', T.REF, { ref: 'Department', refLabel: 'name' }),
      f('weekOff', 'Week Off', T.BOOLEAN, { default: false }),
      notes,
    ], { description: 'Shift rostering for plant and office staff.' }),

    sub('salaryStructure', 'Salary Structure', [
      f('code', 'Structure Code', T.STRING, { required: true, unique: true }),
      f('employee', 'Employee', T.REF, { ref: 'Employee', refLabel: 'employeeCode', required: true }),
      f('effectiveFrom', 'Effective From', T.DATE, { required: true }),
      f('basic', 'Basic', T.CURRENCY, { required: true }),
      f('hraPercent', 'HRA %', T.PERCENT, { default: 20 }),
      f('daPercent', 'DA %', T.PERCENT, { default: 15 }),
      f('specialAllowance', 'Special Allowance', T.CURRENCY, { default: 0 }),
      f('conveyance', 'Conveyance', T.CURRENCY, { default: 0 }),
      f('pfPercent', 'PF %', T.PERCENT, { default: 12 }),
      f('esiPercent', 'ESI %', T.PERCENT, { default: 0.75 }),
      f('professionalTax', 'Professional Tax', T.CURRENCY, { default: 200 }),
      f('status', 'Status', T.SELECT, { options: STATUS, default: 'active' }),
      notes,
    ], { description: 'Salary components per employee.' }),

    sub('payrollRun', 'Payroll Run', [
      f('runNo', 'Run Number', T.STRING, { required: true, unique: true }),
      f('month', 'Month', T.SELECT, { options: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], required: true }),
      f('year', 'Year', T.NUMBER, { required: true }),
      f('employee', 'Employee', T.REF, { ref: 'Employee', refLabel: 'employeeCode', required: true }),
      f('payableDays', 'Payable Days', T.NUMBER, { required: true }),
      f('grossSalary', 'Gross Salary', T.CURRENCY, { readOnly: true }),
      f('totalDeduction', 'Total Deduction', T.CURRENCY, { readOnly: true }),
      f('netSalary', 'Net Salary', T.CURRENCY, { readOnly: true }),
      f('paymentMode', 'Payment Mode', T.SELECT, { options: PAYMENT_MODES, default: 'NEFT' }),
      f('status', 'Status', T.SELECT, { options: ['draft', 'processing', 'approved', 'paid', 'cancelled'], default: 'draft' }),
      notes,
    ], { description: 'Monthly payroll processing per employee.' }),

    sub('statutoryCompliance', 'Statutory Compliance', [
      f('entryNo', 'Entry Number', T.STRING, { required: true, unique: true }),
      f('period', 'Period', T.STRING, { required: true, placeholder: '2025-06' }),
      f('complianceType', 'Compliance Type', T.SELECT, { options: ['PF', 'ESI', 'Professional Tax', 'TDS', 'Labour Welfare Fund', 'Bonus', 'Gratuity'], required: true }),
      f('employeeCount', 'Employee Count', T.NUMBER),
      f('employeeContribution', 'Employee Contribution', T.CURRENCY, { default: 0 }),
      f('employerContribution', 'Employer Contribution', T.CURRENCY, { default: 0 }),
      f('totalAmount', 'Total Amount', T.CURRENCY, { readOnly: true }),
      f('challanNo', 'Challan Number', T.STRING),
      f('paidDate', 'Paid Date', T.DATE),
      f('status', 'Status', T.SELECT, { options: ['pending', 'paid', 'delayed'], default: 'pending' }),
      notes,
    ], { description: 'PF, ESI, PT and TDS remittance tracking.' }),
  ],
});

const reports = mod('reports', 'Reports & Analytics', {
  icon: 'chart',
  order: 13,
  description: 'Operational, financial and statutory reports across all modules.',
  submodules: [],
  pages: [
    { key: 'caneReport', name: 'Cane & Recovery Report', icon: 'sprout', description: 'Cane crushed, recovery and quality trends.' },
    { key: 'productionReport', name: 'Production Report', icon: 'factory', description: 'Shift and season production summary.' },
    { key: 'inventoryReport', name: 'Inventory Report', icon: 'box', description: 'Stock on hand, movement and ageing.' },
    { key: 'purchaseReport', name: 'Purchase Report', icon: 'cart', description: 'Vendor-wise purchase and pending orders.' },
    { key: 'salesReport', name: 'Sales Report', icon: 'truck', description: 'Customer, grade and dispatch analysis.' },
    { key: 'financeReport', name: 'Financial Report', icon: 'wallet', description: 'Ledger, receivables and payables summary.' },
    { key: 'payrollReport', name: 'Payroll Report', icon: 'users', description: 'Salary and statutory summary.' },
    { key: 'qualityReport', name: 'Quality Report', icon: 'flask', description: 'Lab results and non-conformance trends.' },
    { key: 'maintenanceReport', name: 'Maintenance Report', icon: 'wrench', description: 'Downtime, breakdown and maintenance cost.' },
    { key: 'statutoryRegister', name: 'Statutory Registers', icon: 'book', description: 'Registers required by excise and food authorities.' },
  ],
});

module.exports = [hr, reports];
