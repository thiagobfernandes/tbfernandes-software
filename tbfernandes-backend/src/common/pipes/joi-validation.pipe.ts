import { Injectable, PipeTransform } from '@nestjs/common';
import type {
  ObjectSchema,
  ValidationError as JoiError,
  ValidationResult,
} from 'joi';
import { RequestValidationError } from './request-validation.error';

const MESSAGES = {
  'any.required': 'é obrigatório',
  'any.only': 'deve ser um destes valores: {{#valids}}',
  'string.base': 'deve ser um texto',
  'string.empty': 'não pode ficar em branco',
  'string.max': 'deve ter no máximo {{#limit}} caracteres',
  'string.min': 'deve ter pelo menos {{#limit}} caracteres',
  'string.guid': 'deve ser um UUID',
  'string.email': 'deve ser um e-mail válido',
  'string.pattern.name': 'deve estar no formato {{#name}}',
  'number.base': 'deve ser um número',
  'number.integer': 'deve ser um número inteiro',
  'number.min': 'deve ser no mínimo {{#limit}}',
  'number.max': 'deve ser no máximo {{#limit}}',
  'boolean.base': 'deve ser verdadeiro ou falso',
  'array.base': 'deve ser uma lista',
  'array.min': 'deve ter pelo menos {{#limit}} item(ns)',
  'object.base': 'deve ser um objeto',
  'date.invalid': 'não é uma data válida',
};

/**
 * Validates and normalizes a body or query with a Joi schema. Unknown fields are dropped, so
 * the frontend can send a whole record back on PUT. Errors go out as Problem Details with
 * the messages by field (ProblemDetailsFilter).
 */
@Injectable()
export class JoiValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ObjectSchema<T>) {}

  transform(value: unknown): T {
    const result: ValidationResult<T> = this.schema.validate(value ?? {}, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
      convert: true,
      errors: { wrap: { label: false } },
      messages: MESSAGES,
    });
    if (result.error) {
      throw new RequestValidationError(JoiValidationPipe.byField(result.error));
    }
    return result.value;
  }

  private static byField(error: JoiError): Record<string, string[]> {
    const errors: Record<string, string[]> = {};
    for (const detail of error.details) {
      const field = detail.path.join('.') || 'body';
      (errors[field] ??= []).push(detail.message);
    }
    return errors;
  }
}
