import factoryRegistrationRoutes from './factoryRegistrationRoutes.js';
import factoryRoutes from './factoryRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import designationRoutes from './designationRoutes.js';
import warehouseRoutes from './warehouseRoutes.js';
import costCenterRoutes from './costCenterRoutes.js';
import financialYearRoutes from './financialYearRoutes.js';
import itemRoutes from './itemRoutes.js';
import uomRoutes from './uomRoutes.js';
import supplierRoutes from './supplierRoutes.js';
import customerRoutes from './customerRoutes.js';
import transporterRoutes from './transporterRoutes.js';
import vehicleRoutes from './vehicleRoutes.js';
import bankRoutes from './bankRoutes.js';
import taxRateRoutes from './taxRateRoutes.js';
import paymentTermRoutes from './paymentTermRoutes.js';
import farmerRoutes from './farmerRoutes.js';
import caneContractRoutes from './caneContractRoutes.js';
import caneIndentRoutes from './caneIndentRoutes.js';
import caneGateEntryRoutes from './caneGateEntryRoutes.js';
import caneWeighmentRoutes from './caneWeighmentRoutes.js';
import caneQualityRoutes from './caneQualityRoutes.js';
import caneRateRoutes from './caneRateRoutes.js';
import canePaymentRoutes from './canePaymentRoutes.js';
import harvestingScheduleRoutes from './harvestingScheduleRoutes.js';
import crushingPlanRoutes from './crushingPlanRoutes.js';
import shiftProductionRoutes from './shiftProductionRoutes.js';
import juiceAnalysisRoutes from './juiceAnalysisRoutes.js';
import boilingHouseLogRoutes from './boilingHouseLogRoutes.js';
import sugarBaggingRoutes from './sugarBaggingRoutes.js';
import byProductRoutes from './byProductRoutes.js';
import powerGenerationRoutes from './powerGenerationRoutes.js';
import plantDowntimeRoutes from './plantDowntimeRoutes.js';
import purchaseRequisitionRoutes from './purchaseRequisitionRoutes.js';
import purchaseEnquiryRoutes from './purchaseEnquiryRoutes.js';
import quotationRoutes from './quotationRoutes.js';
import purchaseOrderRoutes from './purchaseOrderRoutes.js';
import goodsReceiptRoutes from './goodsReceiptRoutes.js';
import qualityInspectionRoutes from './qualityInspectionRoutes.js';
import purchaseReturnRoutes from './purchaseReturnRoutes.js';
import stockLedgerRoutes from './stockLedgerRoutes.js';
import materialIssueRoutes from './materialIssueRoutes.js';
import stockTransferRoutes from './stockTransferRoutes.js';
import stockAdjustmentRoutes from './stockAdjustmentRoutes.js';
import physicalVerificationRoutes from './physicalVerificationRoutes.js';
import stockValuationRoutes from './stockValuationRoutes.js';
import salesEnquiryRoutes from './salesEnquiryRoutes.js';
import salesOrderRoutes from './salesOrderRoutes.js';
import salesReleaseOrderRoutes from './salesReleaseOrderRoutes.js';
import dispatchRoutes from './dispatchRoutes.js';
import salesInvoiceRoutes from './salesInvoiceRoutes.js';
import salesReturnRoutes from './salesReturnRoutes.js';
import customerReceiptRoutes from './customerReceiptRoutes.js';
import priceListRoutes from './priceListRoutes.js';
import customerLedgerRoutes from './customerLedgerRoutes.js';
import qualitySpecificationRoutes from './qualitySpecificationRoutes.js';
import labTestRoutes from './labTestRoutes.js';
import sampleCollectionRoutes from './sampleCollectionRoutes.js';
import certificateOfAnalysisRoutes from './certificateOfAnalysisRoutes.js';
import nonConformanceRoutes from './nonConformanceRoutes.js';
import equipmentRoutes from './equipmentRoutes.js';
import preventiveMaintenanceRoutes from './preventiveMaintenanceRoutes.js';
import breakdownMaintenanceRoutes from './breakdownMaintenanceRoutes.js';
import spareConsumptionRoutes from './spareConsumptionRoutes.js';
import maintenanceCostRoutes from './maintenanceCostRoutes.js';
import accountGroupRoutes from './accountGroupRoutes.js';
import chartOfAccountRoutes from './chartOfAccountRoutes.js';
import journalVoucherRoutes from './journalVoucherRoutes.js';
import paymentVoucherRoutes from './paymentVoucherRoutes.js';
import receiptVoucherRoutes from './receiptVoucherRoutes.js';
import generalLedgerRoutes from './generalLedgerRoutes.js';
import expenseEntryRoutes from './expenseEntryRoutes.js';
import budgetRoutes from './budgetRoutes.js';
import assetRegisterRoutes from './assetRegisterRoutes.js';
import employeeRoutes from './employeeRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import leaveTypeRoutes from './leaveTypeRoutes.js';
import leaveRequestRoutes from './leaveRequestRoutes.js';
import shiftScheduleRoutes from './shiftScheduleRoutes.js';
import salaryStructureRoutes from './salaryStructureRoutes.js';
import payrollRunRoutes from './payrollRunRoutes.js';
import statutoryComplianceRoutes from './statutoryComplianceRoutes.js';
import companySettingRoutes from './companySettingRoutes.js';
import documentNumberingRoutes from './documentNumberingRoutes.js';
import integrationRoutes from './integrationRoutes.js';
import notificationTemplateRoutes from './notificationTemplateRoutes.js';

export const entityRoutes = new Map([
  ["factoryRegistration", factoryRegistrationRoutes],
  ["factory", factoryRoutes],
  ["department", departmentRoutes],
  ["designation", designationRoutes],
  ["warehouse", warehouseRoutes],
  ["costCenter", costCenterRoutes],
  ["financialYear", financialYearRoutes],
  ["item", itemRoutes],
  ["uom", uomRoutes],
  ["supplier", supplierRoutes],
  ["customer", customerRoutes],
  ["transporter", transporterRoutes],
  ["vehicle", vehicleRoutes],
  ["bank", bankRoutes],
  ["taxRate", taxRateRoutes],
  ["paymentTerm", paymentTermRoutes],
  ["farmer", farmerRoutes],
  ["caneContract", caneContractRoutes],
  ["caneIndent", caneIndentRoutes],
  ["caneGateEntry", caneGateEntryRoutes],
  ["caneWeighment", caneWeighmentRoutes],
  ["caneQuality", caneQualityRoutes],
  ["caneRate", caneRateRoutes],
  ["canePayment", canePaymentRoutes],
  ["harvestingSchedule", harvestingScheduleRoutes],
  ["crushingPlan", crushingPlanRoutes],
  ["shiftProduction", shiftProductionRoutes],
  ["juiceAnalysis", juiceAnalysisRoutes],
  ["boilingHouseLog", boilingHouseLogRoutes],
  ["sugarBagging", sugarBaggingRoutes],
  ["byProduct", byProductRoutes],
  ["powerGeneration", powerGenerationRoutes],
  ["plantDowntime", plantDowntimeRoutes],
  ["purchaseRequisition", purchaseRequisitionRoutes],
  ["purchaseEnquiry", purchaseEnquiryRoutes],
  ["quotation", quotationRoutes],
  ["purchaseOrder", purchaseOrderRoutes],
  ["goodsReceipt", goodsReceiptRoutes],
  ["qualityInspection", qualityInspectionRoutes],
  ["purchaseReturn", purchaseReturnRoutes],
  ["stockLedger", stockLedgerRoutes],
  ["materialIssue", materialIssueRoutes],
  ["stockTransfer", stockTransferRoutes],
  ["stockAdjustment", stockAdjustmentRoutes],
  ["physicalVerification", physicalVerificationRoutes],
  ["stockValuation", stockValuationRoutes],
  ["salesEnquiry", salesEnquiryRoutes],
  ["salesOrder", salesOrderRoutes],
  ["salesReleaseOrder", salesReleaseOrderRoutes],
  ["dispatch", dispatchRoutes],
  ["salesInvoice", salesInvoiceRoutes],
  ["salesReturn", salesReturnRoutes],
  ["customerReceipt", customerReceiptRoutes],
  ["priceList", priceListRoutes],
  ["customerLedger", customerLedgerRoutes],
  ["qualitySpecification", qualitySpecificationRoutes],
  ["labTest", labTestRoutes],
  ["sampleCollection", sampleCollectionRoutes],
  ["certificateOfAnalysis", certificateOfAnalysisRoutes],
  ["nonConformance", nonConformanceRoutes],
  ["equipment", equipmentRoutes],
  ["preventiveMaintenance", preventiveMaintenanceRoutes],
  ["breakdownMaintenance", breakdownMaintenanceRoutes],
  ["spareConsumption", spareConsumptionRoutes],
  ["maintenanceCost", maintenanceCostRoutes],
  ["accountGroup", accountGroupRoutes],
  ["chartOfAccount", chartOfAccountRoutes],
  ["journalVoucher", journalVoucherRoutes],
  ["paymentVoucher", paymentVoucherRoutes],
  ["receiptVoucher", receiptVoucherRoutes],
  ["generalLedger", generalLedgerRoutes],
  ["expenseEntry", expenseEntryRoutes],
  ["budget", budgetRoutes],
  ["assetRegister", assetRegisterRoutes],
  ["employee", employeeRoutes],
  ["attendance", attendanceRoutes],
  ["leaveType", leaveTypeRoutes],
  ["leaveRequest", leaveRequestRoutes],
  ["shiftSchedule", shiftScheduleRoutes],
  ["salaryStructure", salaryStructureRoutes],
  ["payrollRun", payrollRunRoutes],
  ["statutoryCompliance", statutoryComplianceRoutes],
  ["companySetting", companySettingRoutes],
  ["documentNumbering", documentNumberingRoutes],
  ["integration", integrationRoutes],
  ["notificationTemplate", notificationTemplateRoutes],
]);
