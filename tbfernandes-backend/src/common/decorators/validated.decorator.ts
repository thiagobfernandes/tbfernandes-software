import { Body, Query } from '@nestjs/common';
import type { ObjectSchema } from 'joi';
import { JoiValidationPipe } from '../pipes/joi-validation.pipe';

export const ValidatedBody = <T>(schema: ObjectSchema<T>): ParameterDecorator =>
  Body(new JoiValidationPipe(schema));

export const ValidatedQuery = <T>(
  schema: ObjectSchema<T>,
): ParameterDecorator => Query(new JoiValidationPipe(schema));
