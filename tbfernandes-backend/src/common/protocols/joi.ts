import Joi from 'joi';

/**
 * Building blocks for request schemas, written the way the frontend sends values:
 * enums in lower case, days as YYYY-MM-DD, optional fields as null or absent.
 */
export const RequestFields = {
  /** Optional text: null, absent or blank all mean "no value". */
  optionalText(max: number) {
    return Joi.string().trim().max(max).allow(null, '').empty('').default(null);
  },

  requiredText(max: number) {
    return Joi.string().trim().max(max).required();
  },

  /** A lower-case enum value in JSON, upper case in the domain and the database. */
  enumOf<E extends string>(values: readonly E[]) {
    // Not .valid(): Joi returns allowed values as they are, skipping the conversion.
    const lower = values.map((value) => value.toLowerCase());
    return Joi.string().custom((value: string, helpers) => {
      const upper = value.trim().toUpperCase() as E;
      return values.includes(upper)
        ? upper
        : helpers.error('any.only', { valids: lower });
    });
  },

  optionalEnumOf<E extends string>(values: readonly E[]) {
    return RequestFields.enumOf(values).allow(null).default(null);
  },

  isoDate() {
    return Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/, 'AAAA-MM-DD')
      .custom((value: string, helpers) => {
        const date = new Date(`${value}T00:00:00Z`);
        return Number.isNaN(date.getTime()) ||
          date.toISOString().slice(0, 10) !== value
          ? helpers.error('date.invalid')
          : value;
      });
  },

  /** Blank means "no value", as before. */
  optionalIsoDate() {
    return RequestFields.isoDate().allow(null, '').empty('').default(null);
  },

  yearMonth() {
    return Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])$/, 'AAAA-MM');
  },

  uuid() {
    return Joi.string().guid().lowercase();
  },

  /** Blank means "no value", as before. */
  optionalUuid() {
    return RequestFields.uuid().allow(null, '').empty('').default(null);
  },

  /** Lists of uuids, e.g. note links. Absent means empty. */
  uuidList() {
    return Joi.array().items(RequestFields.uuid()).default([]);
  },

  paging() {
    return {
      page: Joi.number().integer().min(0),
      size: Joi.number().integer(),
    };
  },
};

export { Joi };
