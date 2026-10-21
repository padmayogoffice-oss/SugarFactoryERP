import User from '../User.js';
import Role from '../Role.js';
import * as FactoryRegistration from './FactoryRegistration.js';
import * as Factory from './Factory.js';
import * as Department from './Department.js';
import * as Designation from './Designation.js';
import * as Warehouse from './Warehouse.js';
import * as CostCenter from './CostCenter.js';
import * as FinancialYear from './FinancialYear.js';
import * as Item from './Item.js';
import * as Uom from './Uom.js';
import * as Supplier from './Supplier.js';
import * as Customer from './Customer.js';
import * as Transporter from './Transporter.js';
import * as Vehicle from './Vehicle.js';
import * as Bank from './Bank.js';
import * as TaxRate from './TaxRate.js';
import * as PaymentTerm from './PaymentTerm.js';
import * as Farmer from './Farmer.js';
import * as CaneContract from './CaneContract.js';
import * as CaneIndent from './CaneIndent.js';
import * as CaneGateEntry from './CaneGateEntry.js';
import * as CaneWeighment from './CaneWeighment.js';
import * as CaneQuality from './CaneQuality.js';
import * as CaneRate from './CaneRate.js';
import * as CanePayment from './CanePayment.js';
import * as HarvestingSchedule from './HarvestingSchedule.js';
import * as CrushingPlan from './CrushingPlan.js';
import * as ShiftProduction from './ShiftProduction.js';
import * as JuiceAnalysis from './JuiceAnalysis.js';
import * as BoilingHouseLog from './BoilingHouseLog.js';
import * as SugarBagging from './SugarBagging.js';
import * as ByProduct from './ByProduct.js';
import * as PowerGeneration from './PowerGeneration.js';
import * as PlantDowntime from './PlantDowntime.js';
import * as PurchaseRequisition from './PurchaseRequisition.js';
import * as PurchaseEnquiry from './PurchaseEnquiry.js';
import * as Quotation from './Quotation.js';
import * as PurchaseOrder from './PurchaseOrder.js';
import * as GoodsReceipt from './GoodsReceipt.js';
import * as QualityInspection from './QualityInspection.js';
import * as PurchaseReturn from './PurchaseReturn.js';
import * as StockLedger from './StockLedger.js';
import * as MaterialIssue from './MaterialIssue.js';
import * as StockTransfer from './StockTransfer.js';
import * as StockAdjustment from './StockAdjustment.js';
import * as PhysicalVerification from './PhysicalVerification.js';
import * as StockValuation from './StockValuation.js';
import * as SalesEnquiry from './SalesEnquiry.js';
import * as SalesOrder from './SalesOrder.js';
import * as SalesReleaseOrder from './SalesReleaseOrder.js';
import * as Dispatch from './Dispatch.js';
import * as SalesInvoice from './SalesInvoice.js';
import * as SalesReturn from './SalesReturn.js';
import * as CustomerReceipt from './CustomerReceipt.js';
import * as PriceList from './PriceList.js';
import * as CustomerLedger from './CustomerLedger.js';
import * as QualitySpecification from './QualitySpecification.js';
import * as LabTest from './LabTest.js';
import * as SampleCollection from './SampleCollection.js';
import * as CertificateOfAnalysis from './CertificateOfAnalysis.js';
import * as NonConformance from './NonConformance.js';
import * as Equipment from './Equipment.js';
import * as PreventiveMaintenance from './PreventiveMaintenance.js';
import * as BreakdownMaintenance from './BreakdownMaintenance.js';
import * as SpareConsumption from './SpareConsumption.js';
import * as MaintenanceCost from './MaintenanceCost.js';
import * as AccountGroup from './AccountGroup.js';
import * as ChartOfAccount from './ChartOfAccount.js';
import * as JournalVoucher from './JournalVoucher.js';
import * as PaymentVoucher from './PaymentVoucher.js';
import * as ReceiptVoucher from './ReceiptVoucher.js';
import * as GeneralLedger from './GeneralLedger.js';
import * as ExpenseEntry from './ExpenseEntry.js';
import * as Budget from './Budget.js';
import * as AssetRegister from './AssetRegister.js';
import * as Employee from './Employee.js';
import * as Attendance from './Attendance.js';
import * as LeaveType from './LeaveType.js';
import * as LeaveRequest from './LeaveRequest.js';
import * as ShiftSchedule from './ShiftSchedule.js';
import * as SalaryStructure from './SalaryStructure.js';
import * as PayrollRun from './PayrollRun.js';
import * as StatutoryCompliance from './StatutoryCompliance.js';
import * as CompanySetting from './CompanySetting.js';
import * as DocumentNumbering from './DocumentNumbering.js';
import * as Integration from './Integration.js';
import * as NotificationTemplate from './NotificationTemplate.js';

export const entityModels = new Map([
  ["factoryRegistration", FactoryRegistration.model],
  ["factory", Factory.model],
  ["department", Department.model],
  ["designation", Designation.model],
  ["warehouse", Warehouse.model],
  ["costCenter", CostCenter.model],
  ["financialYear", FinancialYear.model],
  ["item", Item.model],
  ["uom", Uom.model],
  ["supplier", Supplier.model],
  ["customer", Customer.model],
  ["transporter", Transporter.model],
  ["vehicle", Vehicle.model],
  ["bank", Bank.model],
  ["taxRate", TaxRate.model],
  ["paymentTerm", PaymentTerm.model],
  ["farmer", Farmer.model],
  ["caneContract", CaneContract.model],
  ["caneIndent", CaneIndent.model],
  ["caneGateEntry", CaneGateEntry.model],
  ["caneWeighment", CaneWeighment.model],
  ["caneQuality", CaneQuality.model],
  ["caneRate", CaneRate.model],
  ["canePayment", CanePayment.model],
  ["harvestingSchedule", HarvestingSchedule.model],
  ["crushingPlan", CrushingPlan.model],
  ["shiftProduction", ShiftProduction.model],
  ["juiceAnalysis", JuiceAnalysis.model],
  ["boilingHouseLog", BoilingHouseLog.model],
  ["sugarBagging", SugarBagging.model],
  ["byProduct", ByProduct.model],
  ["powerGeneration", PowerGeneration.model],
  ["plantDowntime", PlantDowntime.model],
  ["purchaseRequisition", PurchaseRequisition.model],
  ["purchaseEnquiry", PurchaseEnquiry.model],
  ["quotation", Quotation.model],
  ["purchaseOrder", PurchaseOrder.model],
  ["goodsReceipt", GoodsReceipt.model],
  ["qualityInspection", QualityInspection.model],
  ["purchaseReturn", PurchaseReturn.model],
  ["stockLedger", StockLedger.model],
  ["materialIssue", MaterialIssue.model],
  ["stockTransfer", StockTransfer.model],
  ["stockAdjustment", StockAdjustment.model],
  ["physicalVerification", PhysicalVerification.model],
  ["stockValuation", StockValuation.model],
  ["salesEnquiry", SalesEnquiry.model],
  ["salesOrder", SalesOrder.model],
  ["salesReleaseOrder", SalesReleaseOrder.model],
  ["dispatch", Dispatch.model],
  ["salesInvoice", SalesInvoice.model],
  ["salesReturn", SalesReturn.model],
  ["customerReceipt", CustomerReceipt.model],
  ["priceList", PriceList.model],
  ["customerLedger", CustomerLedger.model],
  ["qualitySpecification", QualitySpecification.model],
  ["labTest", LabTest.model],
  ["sampleCollection", SampleCollection.model],
  ["certificateOfAnalysis", CertificateOfAnalysis.model],
  ["nonConformance", NonConformance.model],
  ["equipment", Equipment.model],
  ["preventiveMaintenance", PreventiveMaintenance.model],
  ["breakdownMaintenance", BreakdownMaintenance.model],
  ["spareConsumption", SpareConsumption.model],
  ["maintenanceCost", MaintenanceCost.model],
  ["accountGroup", AccountGroup.model],
  ["chartOfAccount", ChartOfAccount.model],
  ["journalVoucher", JournalVoucher.model],
  ["paymentVoucher", PaymentVoucher.model],
  ["receiptVoucher", ReceiptVoucher.model],
  ["generalLedger", GeneralLedger.model],
  ["expenseEntry", ExpenseEntry.model],
  ["budget", Budget.model],
  ["assetRegister", AssetRegister.model],
  ["employee", Employee.model],
  ["attendance", Attendance.model],
  ["leaveType", LeaveType.model],
  ["leaveRequest", LeaveRequest.model],
  ["shiftSchedule", ShiftSchedule.model],
  ["salaryStructure", SalaryStructure.model],
  ["payrollRun", PayrollRun.model],
  ["statutoryCompliance", StatutoryCompliance.model],
  ["companySetting", CompanySetting.model],
  ["documentNumbering", DocumentNumbering.model],
  ["integration", Integration.model],
  ["notificationTemplate", NotificationTemplate.model],
  ['user', User],
  ['role', Role],
]);
