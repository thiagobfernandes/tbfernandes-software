import { Body, Query } from '@nestjs/common';
import type { ObjectSchema } from 'joi';
import { JoiValidationPipe } from '../pipes/joi-validation.pipe';

/** `@ValidatedBody(schema)`: the body, checked and normalized by a Joi schema. */
export const ValidatedBody = <T>(schema: ObjectSchema<T>): ParameterDecorator =>
  Body(new JoiValidationPipe(schema));

/** `@ValidatedQuery(schema)`: the query string, checked and normalized by a Joi schema. */
export const ValidatedQuery = <T>(
  schema: ObjectSchema<T>,
): ParameterDecorator => Query(new JoiValidationPipe(schema));
