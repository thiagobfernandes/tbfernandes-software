import { Param, PipeTransform } from '@nestjs/common';
import { InvalidArgumentError } from '../domain';

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** A YYYY-MM path parameter. */
export const MonthParam = (name = 'month'): ParameterDecorator => {
  const pipe: PipeTransform<string, string> = {
    transform(value) {
      if (!YEAR_MONTH.test(value)) {
        throw new InvalidArgumentError(
          `${name} precisa estar no formato AAAA-MM`,
        );
      }
      return value;
    },
  };
  return Param(name, pipe);
};
