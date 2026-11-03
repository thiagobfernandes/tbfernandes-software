import { Param, ParseUUIDPipe } from '@nestjs/common';
import { InvalidArgumentError } from '../domain';

/** `@IdParam()`: the `:id` path segment, which must be a UUID (400 otherwise). */
export const IdParam = (name = 'id'): ParameterDecorator =>
  Param(
    name,
    new ParseUUIDPipe({
      exceptionFactory: () =>
        new InvalidArgumentError(`${name} precisa ser um UUID`),
    }),
  );
