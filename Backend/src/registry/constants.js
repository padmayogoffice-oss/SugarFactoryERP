/**
 * Shared option lists for registry select fields. Keeping them here means a
 * value like a sugar grade or GST rate is defined once and reused by every
 * module that needs it.
 */
const STATUS = ['active', 'inactive'];
const APPROVAL_STATUS = ['draft', 'pending', 'approved', 'rejected', 'cancelled'];
const DOC_STATUS = ['draft', 'submitted', 'approved', 'posted', 'closed', 'cancelled'];
const PAYMENT_STATUS = ['unpaid', 'partial', 'paid', 'overdue'];
const SHIFTS = ['A', 'B', 'C', 'General'];
const UOM_OPTIONS = ['MT', 'Quintal', 'Kg', 'Litre', 'KL', 'Nos', 'Bag', 'Box', 'Bundle', 'Meter'];
const GST_RATES = [0, 5, 12, 18, 28];
const SUGAR_GRADES = ['S30', 'S31', 'M30', 'M31', 'L30', 'L31', 'Refined', 'Pharma Grade'];
const SEASON = ['2024-25', '2025-26', '2026-27', '2027-28'];
const PAYMENT_MODES = ['Cash', 'Cheque', 'NEFT', 'RTGS', 'UPI', 'DD'];
const GENDERS = ['Male', 'Female', 'Other'];
const ITEM_CATEGORIES = [
  'Raw Material',
  'Chemical',
  'Spare Part',
  'Consumable',
  'Packing Material',
  'Finished Goods',
  'By-Product',
  'Fuel',
];

module.exports = {
  STATUS,
  APPROVAL_STATUS,
  DOC_STATUS,
  PAYMENT_STATUS,
  SHIFTS,
  UOM_OPTIONS,
  GST_RATES,
  SUGAR_GRADES,
  SEASON,
  PAYMENT_MODES,
  GENDERS,
  ITEM_CATEGORIES,
};
