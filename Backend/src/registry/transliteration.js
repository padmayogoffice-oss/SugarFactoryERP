/**
 * Marathi transliteration policy for registry fields.
 *
 * Decides, once and centrally, which registry fields get a Marathi companion
 * (stored as `<fieldName>Mr`). A field qualifies only when it is a free-text
 * STRING/TEXT field holding human-readable words (names, places, addresses,
 * remarks). Anything machine-readable - codes, document numbers, tax / bank
 * identifiers, URLs, keys, times, enum-like values - is excluded.
 *
 * Precedence: an explicit `translit: true|false` on the field definition wins,
 * then the per-submodule overrides below, then the generic rules.
 */

const MARATHI_SUFFIX = 'Mr';

/** Field types that can ever carry human-readable text. */
const TEXT_TYPES = new Set(['string', 'text']);

/** Names ending in these (camelCase) are identifiers: registrationNo, hsnCode, apiKey... */
const IDENTIFIER_SUFFIX = /[a-z](No|Code|Number|Id|Url|Key|Ref|Time)$/;

/** Field names that are identifiers or other machine-readable values on their own. */
const EXCLUDED_NAMES = new Set([
  'code', 'gstin', 'pan', 'ifsc', 'pincode', 'website', 'endpoint', 'prefix', 'suffix',
  'period', 'event', 'subject', 'body', // notification templates carry {{placeholders}}
  'baseUom', 'priceList', 'costCenter', // reference-style values stored as plain strings
  'caneVariety', 'parameter', 'parameterSummary', 'observedValue', 'specification', 'testMethod',
  'make', 'model', 'capacity', // brand / model / measurement strings
]);

/** `submoduleKey.fieldName` exceptions that the generic rules cannot express. */
const SUBMODULE_EXCLUDED = new Set([
  'integration.name', // system integration label (e.g. a gateway name), not a person/place name
]);

function marathiFieldName(name) {
  return `${name}${MARATHI_SUFFIX}`;
}

function isTransliterable(submoduleKey, field) {
  if (!TEXT_TYPES.has(field.type)) return false;
  if (field.readOnly) return false;
  if (field.enum || field.options) return false;
  if (field.translit === true) return true;
  if (field.translit === false) return false;
  if (SUBMODULE_EXCLUDED.has(`${submoduleKey}.${field.name}`)) return false;
  if (EXCLUDED_NAMES.has(field.name)) return false;
  if (IDENTIFIER_SUFFIX.test(field.name)) return false;
  return true;
}

/**
 * Returns copies of the field definitions annotated with `translit` and
 * `marathiName`. Copies are required because some definitions (like the shared
 * `remarks` field) are reused by many submodules.
 */
function annotateFields(submoduleKey, fields) {
  return fields.map((field) => {
    const translit = isTransliterable(submoduleKey, field);
    return translit ? { ...field, translit, marathiName: marathiFieldName(field.name) } : { ...field, translit: false };
  });
}

export { MARATHI_SUFFIX, marathiFieldName, isTransliterable, annotateFields };
