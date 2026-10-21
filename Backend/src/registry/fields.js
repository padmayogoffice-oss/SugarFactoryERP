/**
 * Field type system.
 *
 * Every submodule in the module registry declares its fields with these
 * definitions. The same declaration is used to build the Mongoose schema,
 * to validate API payloads, and to render the frontend forms/tables, so a
 * field is defined exactly once.
 */

import mongoose from 'mongoose';

const FIELD_TYPES = {
  STRING: 'string',
  TEXT: 'text',
  EMAIL: 'email',
  PHONE: 'phone',
  NUMBER: 'number',
  DECIMAL: 'decimal',
  CURRENCY: 'currency',
  PERCENT: 'percent',
  DATE: 'date',
  BOOLEAN: 'boolean',
  SELECT: 'select',
  MULTISELECT: 'multiselect',
  REF: 'ref',
  REFS: 'refs',
  TAGS: 'tags',
};

/** Shorthand field factory: machine name, UI label, type, extra options. */
function f(name, label, type, extra = {}) {
  return { name, label, type, ...extra };
}

function mongooseExtras(field) {
  const extras = {};
  if (field.required) extras.required = [true, `${field.label} is required`];
  if (field.unique) extras.unique = true;
  if (field.index) extras.index = true;
  if (field.default !== undefined) extras.default = field.default;
  if (field.enum) extras.enum = field.enum;
  if (field.min !== undefined || field.max !== undefined) {
    extras.min = field.min;
    extras.max = field.max;
  }
  return extras;
}

/** Maps a field definition onto a Mongoose schema path definition. */
function toMongooseType(field) {
  switch (field.type) {
    case FIELD_TYPES.NUMBER:
    case FIELD_TYPES.DECIMAL:
    case FIELD_TYPES.CURRENCY:
    case FIELD_TYPES.PERCENT:
      return { type: Number, ...mongooseExtras(field) };
    case FIELD_TYPES.DATE:
      return { type: Date, ...mongooseExtras(field) };
    case FIELD_TYPES.BOOLEAN:
      return { type: Boolean, ...mongooseExtras(field) };
    case FIELD_TYPES.MULTISELECT:
    case FIELD_TYPES.TAGS:
      return { type: [String], ...mongooseExtras(field) };
    case FIELD_TYPES.REFS:
      return { type: [mongoose.Schema.Types.ObjectId], ref: field.ref, ...mongooseExtras(field) };
    case FIELD_TYPES.REF:
      return { type: mongoose.Schema.Types.ObjectId, ref: field.ref, ...mongooseExtras(field) };
    default:
      return { type: String, ...mongooseExtras(field) };
  }
}

/** Coerces an incoming JSON value into the type the schema expects. */
function coerce(field, value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') {
    return field.type === FIELD_TYPES.STRING || field.type === FIELD_TYPES.TEXT ? value : null;
  }

  switch (field.type) {
    case FIELD_TYPES.NUMBER:
    case FIELD_TYPES.DECIMAL:
    case FIELD_TYPES.CURRENCY:
    case FIELD_TYPES.PERCENT: {
      const num = Number(value);
      return Number.isNaN(num) ? value : num;
    }
    case FIELD_TYPES.DATE: {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : date;
    }
    case FIELD_TYPES.BOOLEAN:
      if (typeof value === 'boolean') return value;
      return value === 'true' || value === '1' || value === 1;
    case FIELD_TYPES.MULTISELECT:
    case FIELD_TYPES.TAGS:
    case FIELD_TYPES.REFS:
      if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
      return String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    default:
      return typeof value === 'string' ? value.trim() : value;
  }
}

/** Fields safe to expose to the client for form rendering. */
function toClientSchema(fields) {
  return fields.map((field) => {
    const { name, label, type, required, options, ref, refLabel, refSearch, enum: enumValues, default: defaultValue, inList, inForm, readOnly, unit, min, max, step, placeholder, help, group, minLength, maxLength, translit, marathiName } = field;
    return {
      name,
      label,
      type,
      required: Boolean(required),
      options: options || enumValues,
      ref,
      refLabel,
      refSearch,
      default: defaultValue,
      inList: inList !== false,
      inForm: inForm !== false,
      readOnly: Boolean(readOnly),
      unit,
      min,
      max,
      step,
      placeholder,
      help,
      group,
      minLength,
      maxLength,
      translit: Boolean(translit),
      marathiName: translit ? marathiName : undefined,
    };
  });
}

export { FIELD_TYPES, f, toMongooseType, coerce, toClientSchema };
