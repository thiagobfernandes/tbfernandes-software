import type { ValueTransformer } from 'typeorm';
import { Cents, Money } from '../../domain';

/** numeric(14,2) ↔ cents. PostgreSQL sends numeric as text, so nothing is lost on the way. */
export const centsColumn: ValueTransformer = {
  to: (value: Cents | null | undefined) =>
    value == null ? value : Money.toDecimal(value),
  from: (value: string | null) => (value == null ? null : Money.cents(value)),
};
