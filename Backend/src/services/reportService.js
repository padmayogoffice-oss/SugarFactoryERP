/**
 * Report aggregations. Each exported function backs one report page and returns
 * `{ columns, rows, summary, charts? }`, which the frontend renders generically.
 * Adding a report therefore needs only a new function here plus a page entry in
 * the module registry.
 */
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';

function model(name) {
  const Model = mongoose.models[name];
  if (!Model) throw ApiError.notFound(`Report source "${name}" is not available`);
  return Model;
}

/** Resolves an optional inclusive date range from `from` / `to` query values. */
function dateRange({ from, to } = {}) {
  const range = {};
  if (from) {
    const start = new Date(from);
    if (Number.isNaN(start.getTime())) throw ApiError.badRequest('Invalid "from" date');
    range.$gte = start;
  }
  if (to) {
    const end = new Date(to);
    if (Number.isNaN(end.getTime())) throw ApiError.badRequest('Invalid "to" date');
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return Object.keys(range).length ? range : null;
}

function withDateMatch(field, range) {
  return range ? { [field]: range } : {};
}

/* ------------------------------------------------------------ cane report --- */

async function caneReport(query) {
  const range = dateRange(query);
  const match = withDateMatch('productionDate', range);

  const [totals] = await model('ShiftProduction').aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        caneCrushedMt: { $sum: '$caneCrushedMt' },
        sugarProducedMt: { $sum: '$sugarProducedMt' },
        molassesProducedMt: { $sum: '$molassesProducedMt' },
        bagasseProducedMt: { $sum: '$bagasseProducedMt' },
        shifts: { $sum: 1 },
      },
    },
  ]);

  const byShift = await model('ShiftProduction').aggregate([
    { $match: match },
    { $group: { _id: '$shift', caneCrushedMt: { $sum: '$caneCrushedMt' }, sugarProducedMt: { $sum: '$sugarProducedMt' } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, shift: '$_id', caneCrushedMt: 1, sugarProducedMt: 1 } },
  ]);

  const quality = await model('CaneQuality').aggregate([
    { $match: withDateMatch('sampleDate', range) },
    {
      $group: {
        _id: null,
        avgPol: { $avg: '$polPercent' },
        avgBrix: { $avg: '$brixPercent' },
        avgFibre: { $avg: '$fibrePercent' },
        samples: { $sum: 1 },
      },
    },
  ]);

  const byVariety = await model('CaneQuality').aggregate([
    { $match: withDateMatch('sampleDate', range) },
    {
      $group: {
        _id: '$caneVariety',
        avgPol: { $avg: '$polPercent' },
        avgPurity: { $avg: '$purityPercent' },
        samples: { $sum: 1 },
      },
    },
    { $sort: { samples: -1 } },
    { $project: { _id: 0, variety: { $ifNull: ['$_id', 'Unspecified'] }, avgPol: 1, avgPurity: 1, samples: 1 } },
  ]);

  const cane = totals?.caneCrushedMt || 0;
  const sugar = totals?.sugarProducedMt || 0;

  return {
    summary: {
      caneCrushedMt: cane,
      sugarProducedMt: sugar,
      molassesProducedMt: totals?.molassesProducedMt || 0,
      bagasseProducedMt: totals?.bagasseProducedMt || 0,
      shifts: totals?.shifts || 0,
      recoveryPercent: cane ? Number(((sugar / cane) * 100).toFixed(2)) : 0,
    },
    quality: {
      avgPol: Number((quality[0]?.avgPol || 0).toFixed(2)),
      avgBrix: Number((quality[0]?.avgBrix || 0).toFixed(2)),
      avgFibre: Number((quality[0]?.avgFibre || 0).toFixed(2)),
      samples: quality[0]?.samples || 0,
    },
    byShift,
    byVariety,
  };
}

/* ------------------------------------------------------ production report --- */

async function productionReport(query) {
  const range = dateRange(query);
  const match = withDateMatch('productionDate', range);

  const byShift = await model('ShiftProduction').aggregate([
    { $match: match },
    {
      $group: {
        _id: '$shift',
        caneCrushedMt: { $sum: '$caneCrushedMt' },
        sugarProducedMt: { $sum: '$sugarProducedMt' },
        molassesMt: { $sum: '$molassesProducedMt' },
        bagasseMt: { $sum: '$bagasseProducedMt' },
        downtimeHours: { $sum: '$downtimeHours' },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, shift: '$_id', caneCrushedMt: 1, sugarProducedMt: 1, molassesMt: 1, bagasseMt: 1, downtimeHours: 1 } },
  ]);

  const daily = await model('ShiftProduction').aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$productionDate' } },
        caneCrushedMt: { $sum: '$caneCrushedMt' },
        sugarProducedMt: { $sum: '$sugarProducedMt' },
        downtimeHours: { $sum: '$downtimeHours' },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 60 },
    { $project: { _id: 0, date: '$_id', caneCrushedMt: 1, sugarProducedMt: 1, downtimeHours: 1 } },
  ]);

  const byGrade = await model('SugarBagging').aggregate([
    { $match: withDateMatch('baggingDate', range) },
    { $group: { _id: '$grade', bags: { $sum: '$bagsCount' }, quantityMt: { $sum: '$totalQtyMt' } } },
    { $sort: { quantityMt: -1 } },
    { $project: { _id: 0, grade: '$_id', bags: 1, quantityMt: 1 } },
  ]);

  const downtime = await model('PlantDowntime').aggregate([
    { $match: withDateMatch('stoppageDate', range) },
    { $group: { _id: '$reason', hours: { $sum: '$durationHours' }, lossMt: { $sum: '$lossMt' }, incidents: { $sum: 1 } } },
    { $sort: { hours: -1 } },
    { $project: { _id: 0, reason: '$_id', hours: 1, lossMt: 1, incidents: 1 } },
  ]);

  return { byShift, daily, byGrade, downtime };
}

/* ------------------------------------------------------- inventory report --- */

async function inventoryReport(query) {
  const range = dateRange(query);
  const match = withDateMatch('entryDate', range);

  const stock = await model('StockLedger').aggregate([
    { $match: match },
    { $group: { _id: { item: '$item', warehouse: '$warehouse' }, inQty: { $sum: '$inQty' }, outQty: { $sum: '$outQty' }, value: { $sum: '$value' } } },
    { $project: { _id: 0, item: '$_id.item', warehouse: '$_id.warehouse', balanceQty: { $subtract: ['$inQty', '$outQty'] }, value: 1 } },
    { $match: { balanceQty: { $ne: 0 } } },
    { $sort: { balanceQty: -1 } },
    { $limit: 200 },
    { $lookup: { from: 'items', localField: 'item', foreignField: '_id', as: 'itemDoc' } },
    { $lookup: { from: 'warehouses', localField: 'warehouse', foreignField: '_id', as: 'whDoc' } },
    {
      $project: {
        item: { $ifNull: [{ $first: '$itemDoc.name' }, 'Unknown'] },
        uom: { $ifNull: [{ $first: '$itemDoc.uom' }, ''] },
        warehouse: { $ifNull: [{ $first: '$whDoc.name' }, 'Unknown'] },
        balanceQty: 1,
        value: 1,
      },
    },
  ]);

  const movement = await model('StockLedger').aggregate([
    { $match: match },
    { $group: { _id: '$transactionType', inQty: { $sum: '$inQty' }, outQty: { $sum: '$outQty' }, entries: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, transactionType: '$_id', inQty: 1, outQty: 1, entries: 1 } },
  ]);

  const lowStock = await model('Item').aggregate([
    { $match: { isStocked: true, reorderLevel: { $gt: 0 } } },
    { $lookup: { from: 'stockledgers', localField: '_id', foreignField: 'item', as: 'ledger' } },
    { $project: { name: 1, code: 1, uom: 1, reorderLevel: 1, balanceQty: { $subtract: [{ $sum: '$ledger.inQty' }, { $sum: '$ledger.outQty' }] } } },
    { $match: { $expr: { $lte: ['$balanceQty', '$reorderLevel'] } } },
    { $sort: { balanceQty: 1 } },
    { $limit: 50 },
  ]);

  return { stock, movement, lowStock };
}

/* -------------------------------------------------------- purchase report --- */

async function purchaseReport(query) {
  const range = dateRange(query);
  const match = withDateMatch('poDate', range);

  const byVendor = await model('PurchaseOrder').aggregate([
    { $match: match },
    { $group: { _id: '$supplier', orders: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } },
    { $sort: { totalAmount: -1 } },
    { $limit: 25 },
    { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 'vendor' } },
    { $project: { _id: 0, vendor: { $ifNull: [{ $first: '$vendor.name' }, 'Unknown'] }, orders: 1, totalAmount: 1 } },
  ]);

  const byStatus = await model('PurchaseOrder').aggregate([
    { $match: match },
    { $group: { _id: '$status', orders: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, status: '$_id', orders: 1, totalAmount: 1 } },
  ]);

  const pendingReceipt = await model('PurchaseOrder').aggregate([
    { $match: { status: { $in: ['approved', 'submitted'] } } },
    { $group: { _id: '$supplier', orders: { $sum: 1 }, pendingValue: { $sum: '$totalAmount' } } },
    { $sort: { pendingValue: -1 } },
    { $limit: 25 },
    { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 'vendor' } },
    { $project: { _id: 0, vendor: { $ifNull: [{ $first: '$vendor.name' }, 'Unknown'] }, orders: 1, pendingValue: 1 } },
  ]);

  const returns = await model('PurchaseReturn').aggregate([
    { $match: withDateMatch('returnDate', range) },
    { $group: { _id: '$reason', returns: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } },
    { $sort: { totalAmount: -1 } },
    { $project: { _id: 0, reason: '$_id', returns: 1, totalAmount: 1 } },
  ]);

  return { byVendor, byStatus, pendingReceipt, returns };
}

/* ----------------------------------------------------------- sales report --- */

async function salesReport(query) {
  const range = dateRange(query);
  const match = withDateMatch('invoiceDate', range);

  const [totals] = await model('SalesInvoice').aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        invoices: { $sum: 1 },
        quantityMt: { $sum: '$quantityMt' },
        subTotal: { $sum: '$subTotal' },
        taxAmount: { $sum: { $add: ['$cgstAmount', '$sgstAmount', '$igstAmount'] } },
        grandTotal: { $sum: '$grandTotal' },
      },
    },
  ]);

  const byGrade = await model('SalesInvoice').aggregate([
    { $match: match },
    { $group: { _id: '$grade', quantityMt: { $sum: '$quantityMt' }, grandTotal: { $sum: '$grandTotal' }, invoices: { $sum: 1 } } },
    { $sort: { grandTotal: -1 } },
    { $project: { _id: 0, grade: '$_id', quantityMt: 1, grandTotal: 1, invoices: 1 } },
  ]);

  const byCustomer = await model('SalesInvoice').aggregate([
    { $match: match },
    { $group: { _id: '$customer', quantityMt: { $sum: '$quantityMt' }, grandTotal: { $sum: '$grandTotal' }, invoices: { $sum: 1 } } },
    { $sort: { grandTotal: -1 } },
    { $limit: 25 },
    { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'cust' } },
    { $project: { _id: 0, customer: { $ifNull: [{ $first: '$cust.name' }, 'Unknown'] }, quantityMt: 1, grandTotal: 1, invoices: 1 } },
  ]);

  const byPaymentStatus = await model('SalesInvoice').aggregate([
    { $match: match },
    { $group: { _id: '$paymentStatus', invoices: { $sum: 1 }, outstanding: { $sum: '$grandTotal' } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, paymentStatus: '$_id', invoices: 1, outstanding: 1 } },
  ]);

  const dispatchByTransporter = await model('Dispatch').aggregate([
    { $match: withDateMatch('dispatchDate', range) },
    { $group: { _id: '$transporter', trips: { $sum: 1 }, quantityMt: { $sum: '$quantityMt' }, freight: { $sum: '$freightAmount' } } },
    { $sort: { quantityMt: -1 } },
    { $limit: 25 },
    { $lookup: { from: 'transporters', localField: '_id', foreignField: '_id', as: 'tp' } },
    { $project: { _id: 0, transporter: { $ifNull: [{ $first: '$tp.name' }, 'Own / Unknown'] }, trips: 1, quantityMt: 1, freight: 1 } },
  ]);

  return {
    summary: {
      invoices: totals?.invoices || 0,
      quantityMt: totals?.quantityMt || 0,
      subTotal: totals?.subTotal || 0,
      taxAmount: totals?.taxAmount || 0,
      grandTotal: totals?.grandTotal || 0,
    },
    byGrade,
    byCustomer,
    byPaymentStatus,
    dispatchByTransporter,
  };
}

/* --------------------------------------------------------- finance report --- */

async function financeReport(query) {
  const range = dateRange(query);
  const match = withDateMatch('entryDate', range);

  const trialBalance = await model('GeneralLedger').aggregate([
    { $match: match },
    { $group: { _id: '$account', debit: { $sum: '$debitAmount' }, credit: { $sum: '$creditAmount' } } },
    { $project: { _id: 0, account: '$_id', debit: 1, credit: 1, balance: { $subtract: ['$debit', '$credit'] } } },
    { $lookup: { from: 'chartofaccounts', localField: 'account', foreignField: '_id', as: 'acc' } },
    {
      $project: {
        account: { $ifNull: [{ $first: '$acc.name' }, 'Unknown'] },
        accountType: { $ifNull: [{ $first: '$acc.accountType' }, ''] },
        debit: 1,
        credit: 1,
        balance: 1,
      },
    },
    { $sort: { account: 1 } },
  ]);

  const [totals] = await model('GeneralLedger').aggregate([
    { $match: match },
    { $group: { _id: null, debit: { $sum: '$debitAmount' }, credit: { $sum: '$creditAmount' } } },
  ]);

  const receivables = await model('CustomerLedger').aggregate([
    { $match: withDateMatch('entryDate', range) },
    { $group: { _id: '$customer', debit: { $sum: '$debitAmount' }, credit: { $sum: '$creditAmount' } } },
    { $project: { _id: 0, customer: '$_id', balance: { $subtract: ['$debit', '$credit'] } } },
    { $match: { balance: { $gt: 0 } } },
    { $sort: { balance: -1 } },
    { $limit: 25 },
    { $lookup: { from: 'customers', localField: 'customer', foreignField: '_id', as: 'cust' } },
    { $project: { _id: 0, customer: { $ifNull: [{ $first: '$cust.name' }, 'Unknown'] }, balance: 1 } },
  ]);

  const expensesByHead = await model('ExpenseEntry').aggregate([
    { $match: withDateMatch('expenseDate', range) },
    { $group: { _id: '$expenseHead', amount: { $sum: '$amount' }, gst: { $sum: '$gstAmount' }, entries: { $sum: 1 } } },
    { $sort: { amount: -1 } },
    { $project: { _id: 0, expenseHead: '$_id', amount: 1, gst: 1, entries: 1 } },
  ]);

  const paymentsByMode = await model('PaymentVoucher').aggregate([
    { $match: withDateMatch('voucherDate', range) },
    { $group: { _id: '$paymentMode', vouchers: { $sum: 1 }, amount: { $sum: '$amount' } } },
    { $sort: { amount: -1 } },
    { $project: { _id: 0, paymentMode: '$_id', vouchers: 1, amount: 1 } },
  ]);

  return {
    summary: {
      totalDebit: totals?.debit || 0,
      totalCredit: totals?.credit || 0,
      difference: Number(((totals?.debit || 0) - (totals?.credit || 0)).toFixed(2)),
    },
    trialBalance,
    receivables,
    expensesByHead,
    paymentsByMode,
  };
}

/* --------------------------------------------------------- payroll report --- */

async function payrollReport(query) {
  const match = {};
  if (query.year) match.year = Number(query.year);

  const byMonth = await model('PayrollRun').aggregate([
    { $match: match },
    {
      $group: {
        _id: '$month',
        employees: { $sum: 1 },
        grossSalary: { $sum: '$grossSalary' },
        deduction: { $sum: '$totalDeduction' },
        netSalary: { $sum: '$netSalary' },
      },
    },
    { $project: { _id: 0, month: '$_id', employees: 1, grossSalary: 1, deduction: 1, netSalary: 1 } },
  ]);

  const byDepartment = await model('PayrollRun').aggregate([
    { $match: match },
    { $lookup: { from: 'employees', localField: 'employee', foreignField: '_id', as: 'emp' } },
    { $unwind: { path: '$emp', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'departments', localField: 'emp.department', foreignField: '_id', as: 'dept' } },
    {
      $group: {
        _id: { $ifNull: [{ $first: '$dept.name' }, 'Unassigned'] },
        employees: { $sum: 1 },
        netSalary: { $sum: '$netSalary' },
      },
    },
    { $sort: { netSalary: -1 } },
    { $project: { _id: 0, department: '$_id', employees: 1, netSalary: 1 } },
  ]);

  const statutory = await model('StatutoryCompliance').aggregate([
    { $group: { _id: '$complianceType', amount: { $sum: '$totalAmount' }, entries: { $sum: 1 } } },
    { $sort: { amount: -1 } },
    { $project: { _id: 0, complianceType: '$_id', amount: 1, entries: 1 } },
  ]);

  return { byMonth, byDepartment, statutory };
}

/* --------------------------------------------------------- quality report --- */

async function qualityReport(query) {
  const range = dateRange(query);
  const match = withDateMatch('testDate', range);

  const byResult = await model('LabTest').aggregate([
    { $match: match },
    { $group: { _id: '$result', tests: { $sum: 1 } } },
    { $sort: { tests: -1 } },
    { $project: { _id: 0, result: '$_id', tests: 1 } },
  ]);

  const bySampleType = await model('LabTest').aggregate([
    { $match: match },
    { $group: { _id: '$sampleType', tests: { $sum: 1 }, pass: { $sum: { $cond: [{ $eq: ['$result', 'Pass'] }, 1, 0] } } } },
    { $sort: { tests: -1 } },
    { $project: { _id: 0, sampleType: '$_id', tests: 1, pass: 1 } },
  ]);

  const nonConformance = await model('NonConformance').aggregate([
    { $match: withDateMatch('reportedDate', range) },
    { $group: { _id: { severity: '$severity', status: '$status' }, count: { $sum: 1 } } },
    { $project: { _id: 0, severity: '$_id.severity', status: '$_id.status', count: 1 } },
  ]);

  const [sugarQuality] = await model('LabTest').aggregate([
    { $match: { sampleType: 'Sugar' } },
    { $group: { _id: null, tests: { $sum: 1 }, avgValue: { $avg: '$observedValue' } } },
  ]);

  return {
    byResult,
    bySampleType,
    nonConformance,
    sugarQuality: { tests: sugarQuality?.tests || 0, avgValue: Number((sugarQuality?.avgValue || 0).toFixed(2)) },
  };
}

/* ----------------------------------------------------- maintenance report --- */

async function maintenanceReport(query) {
  const range = dateRange(query);

  const breakdown = await model('BreakdownMaintenance').aggregate([
    { $match: withDateMatch('reportedAt', range) },
    { $group: { _id: '$breakdownType', tickets: { $sum: 1 }, downtimeHours: { $sum: '$downtimeHours' } } },
    { $sort: { downtimeHours: -1 } },
    { $project: { _id: 0, breakdownType: '$_id', tickets: 1, downtimeHours: 1 } },
  ]);

  const byEquipment = await model('BreakdownMaintenance').aggregate([
    { $match: withDateMatch('reportedAt', range) },
    { $group: { _id: '$equipment', tickets: { $sum: 1 }, downtimeHours: { $sum: '$downtimeHours' } } },
    { $sort: { downtimeHours: -1 } },
    { $limit: 20 },
    { $lookup: { from: 'equipment', localField: '_id', foreignField: '_id', as: 'eq' } },
    { $project: { _id: 0, equipment: { $ifNull: [{ $first: '$eq.name' }, 'Unknown'] }, tickets: 1, downtimeHours: 1 } },
  ]);

  const costByHead = await model('MaintenanceCost').aggregate([
    { $match: withDateMatch('entryDate', range) },
    { $group: { _id: '$costHead', amount: { $sum: '$amount' }, entries: { $sum: 1 } } },
    { $sort: { amount: -1 } },
    { $project: { _id: 0, costHead: '$_id', amount: 1, entries: 1 } },
  ]);

  const pmCompliance = await model('PreventiveMaintenance').aggregate([
    { $group: { _id: '$status', schedules: { $sum: 1 } } },
    { $sort: { schedules: -1 } },
    { $project: { _id: 0, status: '$_id', schedules: 1 } },
  ]);

  const spareConsumption = await model('SpareConsumption').aggregate([
    { $match: withDateMatch('entryDate', range) },
    { $group: { _id: '$item', quantity: { $sum: '$quantity' }, value: { $sum: '$totalValue' } } },
    { $sort: { value: -1 } },
    { $limit: 20 },
    { $lookup: { from: 'items', localField: '_id', foreignField: '_id', as: 'it' } },
    { $project: { _id: 0, item: { $ifNull: [{ $first: '$it.name' }, 'Unknown'] }, quantity: 1, value: 1 } },
  ]);

  return { breakdown, byEquipment, costByHead, pmCompliance, spareConsumption };
}

/* --------------------------------------------------- statutory registers --- */

async function statutoryRegister(query) {
  const range = dateRange(query);

  const canePurchase = await model('CaneWeighment').aggregate([
    { $match: withDateMatch('weighDate', range) },
    {
      $group: {
        _id: null,
        slips: { $sum: 1 },
        netWeightMt: { $sum: '$netWeightMt' },
        grossWeightMt: { $sum: '$grossWeightMt' },
      },
    },
  ]);

  const sugarStock = await model('SugarBagging').aggregate([
    { $match: withDateMatch('baggingDate', range) },
    { $group: { _id: '$grade', bags: { $sum: '$bagsCount' }, quantityMt: { $sum: '$totalQtyMt' } } },
    { $sort: { quantityMt: -1 } },
    { $project: { _id: 0, grade: '$_id', bags: 1, quantityMt: 1 } },
  ]);

  const molassesStock = await model('ByProduct').aggregate([
    { $match: { productType: 'Molasses' } },
    { $group: { _id: '$productType', quantityMt: { $sum: '$quantityMt' }, entries: { $sum: 1 } } },
    { $project: { _id: 0, productType: '$_id', quantityMt: 1, entries: 1 } },
  ]);

  const gstSummary = await model('SalesInvoice').aggregate([
    { $match: withDateMatch('invoiceDate', range) },
    {
      $group: {
        _id: null,
        taxableValue: { $sum: '$subTotal' },
        cgst: { $sum: '$cgstAmount' },
        sgst: { $sum: '$sgstAmount' },
        igst: { $sum: '$igstAmount' },
        invoices: { $sum: 1 },
      },
    },
  ]);

  const purchaseGst = await model('PurchaseOrder').aggregate([
    { $match: withDateMatch('poDate', range) },
    { $group: { _id: null, taxableValue: { $sum: '$subTotal' }, tax: { $sum: '$taxAmount' }, orders: { $sum: 1 } } },
  ]);

  return {
    canePurchase: {
      slips: canePurchase[0]?.slips || 0,
      netWeightMt: canePurchase[0]?.netWeightMt || 0,
      grossWeightMt: canePurchase[0]?.grossWeightMt || 0,
    },
    sugarStock,
    molassesStock,
    gstSummary: {
      taxableValue: gstSummary[0]?.taxableValue || 0,
      cgst: gstSummary[0]?.cgst || 0,
      sgst: gstSummary[0]?.sgst || 0,
      igst: gstSummary[0]?.igst || 0,
      invoices: gstSummary[0]?.invoices || 0,
    },
    purchaseGst: {
      taxableValue: purchaseGst[0]?.taxableValue || 0,
      tax: purchaseGst[0]?.tax || 0,
      orders: purchaseGst[0]?.orders || 0,
    },
  };
}

/* --------------------------------------------------- financial statements --- */

async function trialBalance(query) {
  const data = await financeReport(query);
  return {
    summary: data.summary,
    rows: data.trialBalance,
  };
}

async function profitAndLoss(query) {
  const range = dateRange(query);
  const match = withDateMatch('entryDate', range);

  const byType = await model('GeneralLedger').aggregate([
    { $match: match },
    { $lookup: { from: 'chartofaccounts', localField: 'account', foreignField: '_id', as: 'acc' } },
    { $unwind: { path: '$acc', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ['$acc.accountType', 'Unclassified'] },
        debit: { $sum: '$debitAmount' },
        credit: { $sum: '$creditAmount' },
      },
    },
    { $project: { _id: 0, accountType: '$_id', debit: 1, credit: 1 } },
    { $sort: { accountType: 1 } },
  ]);

  const income = byType.find((row) => row.accountType === 'Income');
  const expense = byType.find((row) => row.accountType === 'Expense');
  const totalIncome = (income?.credit || 0) - (income?.debit || 0);
  const totalExpense = (expense?.debit || 0) - (expense?.credit || 0);

  return {
    rows: byType,
    summary: {
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpense: Number(totalExpense.toFixed(2)),
      netProfit: Number((totalIncome - totalExpense).toFixed(2)),
    },
  };
}

async function balanceSheet(query) {
  const range = dateRange(query);
  const match = withDateMatch('entryDate', range);

  const byType = await model('GeneralLedger').aggregate([
    { $match: match },
    { $lookup: { from: 'chartofaccounts', localField: 'account', foreignField: '_id', as: 'acc' } },
    { $unwind: { path: '$acc', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ['$acc.accountType', 'Unclassified'] },
        debit: { $sum: '$debitAmount' },
        credit: { $sum: '$creditAmount' },
      },
    },
    { $project: { _id: 0, accountType: '$_id', debit: 1, credit: 1 } },
    { $sort: { accountType: 1 } },
  ]);

  const pick = (type) => byType.find((row) => row.accountType === type);
  const assets = (pick('Asset')?.debit || 0) - (pick('Asset')?.credit || 0);
  const liabilities = (pick('Liability')?.credit || 0) - (pick('Liability')?.debit || 0);
  const equity = (pick('Equity')?.credit || 0) - (pick('Equity')?.debit || 0);

  return {
    rows: byType,
    summary: {
      totalAssets: Number(assets.toFixed(2)),
      totalLiabilities: Number(liabilities.toFixed(2)),
      totalEquity: Number(equity.toFixed(2)),
    },
  };
}

async function dayBook(query) {
  const range = dateRange(query) || (() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return { $gte: start };
  })();

  const vouchers = await model('GeneralLedger')
    .find({ entryDate: range })
    .populate('account', 'name code')
    .sort({ entryDate: 1, createdAt: 1 })
    .limit(500)
    .lean();

  return {
    rows: vouchers.map((voucher) => ({
      entryNo: voucher.entryNo,
      entryDate: voucher.entryDate,
      account: voucher.account?.name || 'Unknown',
      voucherType: voucher.voucherType,
      voucherNo: voucher.voucherNo,
      debitAmount: voucher.debitAmount || 0,
      creditAmount: voucher.creditAmount || 0,
      narration: voucher.narration || '',
    })),
    summary: {
      entries: vouchers.length,
      totalDebit: Number(vouchers.reduce((acc, item) => acc + (item.debitAmount || 0), 0).toFixed(2)),
      totalCredit: Number(vouchers.reduce((acc, item) => acc + (item.creditAmount || 0), 0).toFixed(2)),
    },
  };
}

export { caneReport, productionReport, inventoryReport, purchaseReport, salesReport, financeReport, payrollReport, qualityReport, maintenanceReport, statutoryRegister, trialBalance, profitAndLoss, balanceSheet, dayBook };
