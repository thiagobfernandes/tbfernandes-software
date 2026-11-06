import { Param, ParseUUIDPipe } from '@nestjs/common';
import { InvalidArgumentError } from '../domain';

export const IdParam = (name = 'id'): ParameterDecorator =>
  Param(
    name,
    new ParseUUIDPipe({
      exceptionFactory: () =>
        new InvalidArgumentError(`${name} precisa ser um UUID`),
    }),
  );
