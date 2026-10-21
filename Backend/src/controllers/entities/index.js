import * as factoryRegistrationController from './factoryRegistrationController.js'
import * as factoryController from './factoryController.js'
import * as departmentController from './departmentController.js'
import * as designationController from './designationController.js'
import * as warehouseController from './warehouseController.js'
import * as costCenterController from './costCenterController.js'
import * as financialYearController from './financialYearController.js'
import * as itemController from './itemController.js'
import * as uomController from './uomController.js'
import * as supplierController from './supplierController.js'
import * as customerController from './customerController.js'
import * as transporterController from './transporterController.js'
import * as vehicleController from './vehicleController.js'
import * as bankController from './bankController.js'
import * as taxRateController from './taxRateController.js'
import * as paymentTermController from './paymentTermController.js'
import * as farmerController from './farmerController.js'
import * as caneContractController from './caneContractController.js'
import * as caneIndentController from './caneIndentController.js'
import * as caneGateEntryController from './caneGateEntryController.js'
import * as caneWeighmentController from './caneWeighmentController.js'
import * as caneQualityController from './caneQualityController.js'
import * as caneRateController from './caneRateController.js'
import * as canePaymentController from './canePaymentController.js'
import * as harvestingScheduleController from './harvestingScheduleController.js'
import * as crushingPlanController from './crushingPlanController.js'
import * as shiftProductionController from './shiftProductionController.js'
import * as juiceAnalysisController from './juiceAnalysisController.js'
import * as boilingHouseLogController from './boilingHouseLogController.js'
import * as sugarBaggingController from './sugarBaggingController.js'
import * as byProductController from './byProductController.js'
import * as powerGenerationController from './powerGenerationController.js'
import * as plantDowntimeController from './plantDowntimeController.js'
import * as purchaseRequisitionController from './purchaseRequisitionController.js'
import * as purchaseEnquiryController from './purchaseEnquiryController.js'
import * as quotationController from './quotationController.js'
import * as purchaseOrderController from './purchaseOrderController.js'
import * as goodsReceiptController from './goodsReceiptController.js'
import * as qualityInspectionController from './qualityInspectionController.js'
import * as purchaseReturnController from './purchaseReturnController.js'
import * as stockLedgerController from './stockLedgerController.js'
import * as materialIssueController from './materialIssueController.js'
import * as stockTransferController from './stockTransferController.js'
import * as stockAdjustmentController from './stockAdjustmentController.js'
import * as physicalVerificationController from './physicalVerificationController.js'
import * as stockValuationController from './stockValuationController.js'
import * as salesEnquiryController from './salesEnquiryController.js'
import * as salesOrderController from './salesOrderController.js'
import * as salesReleaseOrderController from './salesReleaseOrderController.js'
import * as dispatchController from './dispatchController.js'
import * as salesInvoiceController from './salesInvoiceController.js'
import * as salesReturnController from './salesReturnController.js'
import * as customerReceiptController from './customerReceiptController.js'
import * as priceListController from './priceListController.js'
import * as customerLedgerController from './customerLedgerController.js'
import * as qualitySpecificationController from './qualitySpecificationController.js'
import * as labTestController from './labTestController.js'
import * as sampleCollectionController from './sampleCollectionController.js'
import * as certificateOfAnalysisController from './certificateOfAnalysisController.js'
import * as nonConformanceController from './nonConformanceController.js'
import * as equipmentController from './equipmentController.js'
import * as preventiveMaintenanceController from './preventiveMaintenanceController.js'
import * as breakdownMaintenanceController from './breakdownMaintenanceController.js'
import * as spareConsumptionController from './spareConsumptionController.js'
import * as maintenanceCostController from './maintenanceCostController.js'
import * as accountGroupController from './accountGroupController.js'
import * as chartOfAccountController from './chartOfAccountController.js'
import * as journalVoucherController from './journalVoucherController.js'
import * as paymentVoucherController from './paymentVoucherController.js'
import * as receiptVoucherController from './receiptVoucherController.js'
import * as generalLedgerController from './generalLedgerController.js'
import * as expenseEntryController from './expenseEntryController.js'
import * as budgetController from './budgetController.js'
import * as assetRegisterController from './assetRegisterController.js'
import * as employeeController from './employeeController.js'
import * as attendanceController from './attendanceController.js'
import * as leaveTypeController from './leaveTypeController.js'
import * as leaveRequestController from './leaveRequestController.js'
import * as shiftScheduleController from './shiftScheduleController.js'
import * as salaryStructureController from './salaryStructureController.js'
import * as payrollRunController from './payrollRunController.js'
import * as statutoryComplianceController from './statutoryComplianceController.js'
import * as companySettingController from './companySettingController.js'
import * as documentNumberingController from './documentNumberingController.js'
import * as integrationController from './integrationController.js'
import * as notificationTemplateController from './notificationTemplateController.js'

export const entityControllers = new Map([
  ["factoryRegistration", factoryRegistrationController],
  ["factory", factoryController],
  ["department", departmentController],
  ["designation", designationController],
  ["warehouse", warehouseController],
  ["costCenter", costCenterController],
  ["financialYear", financialYearController],
  ["item", itemController],
  ["uom", uomController],
  ["supplier", supplierController],
  ["customer", customerController],
  ["transporter", transporterController],
  ["vehicle", vehicleController],
  ["bank", bankController],
  ["taxRate", taxRateController],
  ["paymentTerm", paymentTermController],
  ["farmer", farmerController],
  ["caneContract", caneContractController],
  ["caneIndent", caneIndentController],
  ["caneGateEntry", caneGateEntryController],
  ["caneWeighment", caneWeighmentController],
  ["caneQuality", caneQualityController],
  ["caneRate", caneRateController],
  ["canePayment", canePaymentController],
  ["harvestingSchedule", harvestingScheduleController],
  ["crushingPlan", crushingPlanController],
  ["shiftProduction", shiftProductionController],
  ["juiceAnalysis", juiceAnalysisController],
  ["boilingHouseLog", boilingHouseLogController],
  ["sugarBagging", sugarBaggingController],
  ["byProduct", byProductController],
  ["powerGeneration", powerGenerationController],
  ["plantDowntime", plantDowntimeController],
  ["purchaseRequisition", purchaseRequisitionController],
  ["purchaseEnquiry", purchaseEnquiryController],
  ["quotation", quotationController],
  ["purchaseOrder", purchaseOrderController],
  ["goodsReceipt", goodsReceiptController],
  ["qualityInspection", qualityInspectionController],
  ["purchaseReturn", purchaseReturnController],
  ["stockLedger", stockLedgerController],
  ["materialIssue", materialIssueController],
  ["stockTransfer", stockTransferController],
  ["stockAdjustment", stockAdjustmentController],
  ["physicalVerification", physicalVerificationController],
  ["stockValuation", stockValuationController],
  ["salesEnquiry", salesEnquiryController],
  ["salesOrder", salesOrderController],
  ["salesReleaseOrder", salesReleaseOrderController],
  ["dispatch", dispatchController],
  ["salesInvoice", salesInvoiceController],
  ["salesReturn", salesReturnController],
  ["customerReceipt", customerReceiptController],
  ["priceList", priceListController],
  ["customerLedger", customerLedgerController],
  ["qualitySpecification", qualitySpecificationController],
  ["labTest", labTestController],
  ["sampleCollection", sampleCollectionController],
  ["certificateOfAnalysis", certificateOfAnalysisController],
  ["nonConformance", nonConformanceController],
  ["equipment", equipmentController],
  ["preventiveMaintenance", preventiveMaintenanceController],
  ["breakdownMaintenance", breakdownMaintenanceController],
  ["spareConsumption", spareConsumptionController],
  ["maintenanceCost", maintenanceCostController],
  ["accountGroup", accountGroupController],
  ["chartOfAccount", chartOfAccountController],
  ["journalVoucher", journalVoucherController],
  ["paymentVoucher", paymentVoucherController],
  ["receiptVoucher", receiptVoucherController],
  ["generalLedger", generalLedgerController],
  ["expenseEntry", expenseEntryController],
  ["budget", budgetController],
  ["assetRegister", assetRegisterController],
  ["employee", employeeController],
  ["attendance", attendanceController],
  ["leaveType", leaveTypeController],
  ["leaveRequest", leaveRequestController],
  ["shiftSchedule", shiftScheduleController],
  ["salaryStructure", salaryStructureController],
  ["payrollRun", payrollRunController],
  ["statutoryCompliance", statutoryComplianceController],
  ["companySetting", companySettingController],
  ["documentNumbering", documentNumberingController],
  ["integration", integrationController],
  ["notificationTemplate", notificationTemplateController],
]);
