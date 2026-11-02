import { NotFoundException } from '@nestjs/common';
import {
  BusinessRuleViolationError,
  ConflictError,
  ExternalServiceError,
  InvalidArgumentError,
  NotFoundError,
} from '../domain';
import { RequestValidationError } from '../pipes/request-validation.error';
import { ProblemDetailsFilter } from './problem-details.filter';

describe('ProblemDetailsFilter', () => {
  const toProblem = (error: unknown) => ProblemDetailsFilter.toProblem(error);

  it('maps each domain error to its status', () => {
    expect(toProblem(new NotFoundError('A tarefa', 'x')).status).toBe(404);
    expect(toProblem(new ConflictError('RN-01', 'busy'))).toMatchObject({
      status: 409,
      rule: 'RN-01',
    });
    expect(
      toProblem(new BusinessRuleViolationError('RN-07', 'blocked')),
    ).toMatchObject({ status: 422, rule: 'RN-07' });
    expect(toProblem(new InvalidArgumentError('bad')).status).toBe(400);
    expect(toProblem(new ExternalServiceError('down')).status).toBe(502);
  });

  it('keeps field errors and Nest exceptions', () => {
    expect(
      toProblem(new RequestValidationError({ name: ['é obrigatório'] })),
    ).toMatchObject({
      status: 400,
      errors: { name: ['é obrigatório'] },
    });
    expect(toProblem(new NotFoundException()).status).toBe(404);
  });
});
