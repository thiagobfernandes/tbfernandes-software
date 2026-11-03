import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  BusinessRuleViolationError,
  ConflictError,
  DomainError,
  ExternalServiceError,
  InvalidArgumentError,
  NotFoundError,
  UnauthenticatedError,
} from '../domain';
import { RequestValidationError } from '../pipes/request-validation.error';
import { ProblemDetail, sendProblem } from '../protocols/problem-detail';
import { translateDatabaseError } from '../../infrastructure/database/database-error.translator';
import { Logger } from '../../infrastructure/logger';

/**
 * Every error leaves as RFC 9457 Problem Details: NotFound 404, Conflict 409, business rule
 * 422 (with "rule"), invalid field 400 (with "errors" by field), external provider 502.
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const res = http.getResponse<Response>();
    if (res.headersSent) return;
    sendProblem(res, {
      ...ProblemDetailsFilter.toProblem(exception),
      instance: http.getRequest<Request>().path,
    });
  }

  static toProblem(exception: unknown): ProblemDetail {
    if (exception instanceof RequestValidationError) {
      return {
        status: 400,
        detail: exception.message,
        errors: exception.errors,
      };
    }
    const domain =
      exception instanceof DomainError
        ? exception
        : translateDatabaseError(exception);
    if (domain) return ProblemDetailsFilter.fromDomain(domain);
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const detail =
        typeof body === 'string'
          ? body
          : ((body as { message?: unknown }).message ?? exception.message);
      const text = Array.isArray(detail)
        ? detail.join('; ')
        : typeof detail === 'string'
          ? detail
          : JSON.stringify(detail);
      // body-parser's own message for a body that is not JSON.
      if (
        status === 400 &&
        (exception.cause instanceof SyntaxError || /\bJSON\b/.test(text))
      ) {
        return { status, detail: 'O corpo da requisição não é um JSON válido' };
      }
      return { status, detail: text };
    }
    Logger.error('Unexpected error', exception);
    return { status: 500, detail: 'Erro inesperado' };
  }

  private static fromDomain(error: DomainError): ProblemDetail {
    if (error instanceof ConflictError) {
      return {
        status: 409,
        title: 'Conflict',
        detail: error.message,
        rule: error.rule,
      };
    }
    if (error instanceof BusinessRuleViolationError) {
      return {
        status: 422,
        title: 'Regra de negócio violada',
        detail: error.message,
        rule: error.rule,
      };
    }
    if (error instanceof NotFoundError)
      return { status: 404, detail: error.message };
    if (error instanceof InvalidArgumentError)
      return { status: 400, detail: error.message };
    if (error instanceof UnauthenticatedError)
      return { status: 401, detail: error.message };
    if (error instanceof ExternalServiceError) {
      Logger.warn(error.message, error.cause);
      return { status: 502, detail: error.message };
    }
    Logger.error('Unmapped domain error', error);
    return { status: 500, detail: 'Erro inesperado' };
  }
}
