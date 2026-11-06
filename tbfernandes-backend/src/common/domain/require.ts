import { BusinessRuleViolationError, InvalidArgumentError } from './errors';
import { IsoDate } from './types';

export const Require = {
  text(
    value: string | null | undefined,
    field: string,
    maxLength: number,
  ): string {
    if (value == null || value.trim() === '') {
      throw new InvalidArgumentError(`${field} é obrigatório`);
    }
    const trimmed = value.trim();
    if (trimmed.length > maxLength) {
      throw new InvalidArgumentError(
        `${field} deve ter no máximo ${maxLength} caracteres`,
      );
    }
    return trimmed;
  },

  optionalText(
    value: string | null | undefined,
    field: string,
    maxLength: number,
  ): string | null {
    return value == null || value.trim() === ''
      ? null
      : Require.text(value, field, maxLength);
  },

  present<T>(value: T | null | undefined, field: string): T {
    if (value == null) {
      throw new InvalidArgumentError(`${field} é obrigatório`);
    }
    return value;
  },

  /** RN-02: an end date never comes before its start date. */
  dateOrder(
    start: IsoDate | null | undefined,
    end: IsoDate | null | undefined,
    endField: string,
  ): void {
    if (start && end && end < start) {
      throw new BusinessRuleViolationError(
        'RN-02',
        `${endField} não pode ser anterior à data de início`,
      );
    }
  },
};
