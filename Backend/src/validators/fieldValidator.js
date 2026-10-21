import { FIELD_TYPES, coerce } from '../registry/fields.js';

/** Upper bound for a stored Marathi companion value. */
const MARATHI_MAX_LENGTH = 4000;

/** Validates a single field value; returns an error message or null. */
function validateValue(field, value) {
  const isEmpty =
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0);

  if (isEmpty) {
    if (field.required && field.default === undefined) return `${field.label} is required`;
    return null;
  }

  if (field.enum && !field.enum.includes(value)) {
    return `${field.label} must be one of: ${field.enum.join(', ')}`;
  }

  switch (field.type) {
    case FIELD_TYPES.NUMBER:
    case FIELD_TYPES.DECIMAL:
    case FIELD_TYPES.CURRENCY:
    case FIELD_TYPES.PERCENT:
      if (typeof value !== 'number' || Number.isNaN(value)) return `${field.label} must be a number`;
      break;
    case FIELD_TYPES.DATE:
      if (!(value instanceof Date) || Number.isNaN(value.getTime())) return `${field.label} must be a valid date`;
      break;
    case FIELD_TYPES.EMAIL:
      if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return `${field.label} must be a valid email address`;
      }
      break;
    case FIELD_TYPES.REF:
      if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value)) return `${field.label} must be a valid reference`;
      break;
    case FIELD_TYPES.REFS:
      if (!Array.isArray(value)) return `${field.label} must be a list of references`;
      if (value.some((item) => typeof item !== 'string' || !/^[a-f\d]{24}$/i.test(item))) {
        return `${field.label} contains an invalid reference`;
      }
      break;
    default:
      break;
  }

  if (typeof value === 'string') {
    if (field.minLength && value.length < field.minLength) return `${field.label} must be at least ${field.minLength} characters`;
    if (field.maxLength && value.length > field.maxLength) return `${field.label} must be at most ${field.maxLength} characters`;
  }

  if (typeof value === 'number') {
    if (field.min !== undefined && value < field.min) return `${field.label} must be at least ${field.min}`;
    if (field.max !== undefined && value > field.max) return `${field.label} must be at most ${field.max}`;
  }

  return null;
}

/** Validates a whole payload against a submodule's field list. */
function validatePayload(fields, payload, { partial = false } = {}) {
  const errors = [];
  const result = {};

  for (const field of fields) {
    if (field.readOnly) continue;
    const hasValue = Object.prototype.hasOwnProperty.call(payload, field.name);
    if (!hasValue) {
      if (!partial && field.required && field.default === undefined) {
        errors.push(`${field.label} is required`);
      }
      continue;
    }

    const coerced = coerce(field, payload[field.name]);
    const error = validateValue(field, coerced);
    if (error) {
      errors.push(error);
      continue;
    }
    result[field.name] = coerced;
  }

  for (const field of fields) {
    if (!field.translit || !field.marathiName) continue;
    if (!Object.prototype.hasOwnProperty.call(payload, field.marathiName)) continue;
    const raw = payload[field.marathiName];
    if (raw === null || raw === undefined || raw === '') {
      result[field.marathiName] = '';
      continue;
    }
    if (typeof raw !== 'string') {
      errors.push(`${field.label} (Marathi) must be text`);
      continue;
    }
    const text = raw.trim();
    if (text.length > MARATHI_MAX_LENGTH) {
      errors.push(`${field.label} (Marathi) must be at most ${MARATHI_MAX_LENGTH} characters`);
      continue;
    }
    result[field.marathiName] = text;
  }

  return { errors, value: result };
}

export { validatePayload, validateValue };
