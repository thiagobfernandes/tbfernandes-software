import { JoiValidationPipe } from '../pipes/joi-validation.pipe';
import { RequestValidationError } from '../pipes/request-validation.error';
import { RequestFields, Joi } from './joi';

describe('request schemas', () => {
  const pipe = new JoiValidationPipe(
    Joi.object({
      name: RequestFields.requiredText(5),
      note: RequestFields.optionalText(10),
      status: RequestFields.optionalEnumOf(['IN_PROGRESS', 'DONE'] as const),
      day: RequestFields.optionalIsoDate(),
    }),
  );

  it('turns lower-case enums into domain values, blanks into null and drops unknown fields', () => {
    expect(
      pipe.transform({
        name: ' ab ',
        note: '',
        status: 'in_progress',
        extra: 1,
      }),
    ).toEqual({
      name: 'ab',
      note: null,
      status: 'IN_PROGRESS',
      day: null,
    });
  });

  it('reports every invalid field, in Portuguese', () => {
    try {
      pipe.transform({ name: 'too long', status: 'nope', day: '2026-02-30' });
      fail('expected a validation error');
    } catch (error) {
      expect(error).toBeInstanceOf(RequestValidationError);
      const errors = (error as RequestValidationError).errors;
      expect(Object.keys(errors).sort()).toEqual(['day', 'name', 'status']);
      expect(errors.name[0]).toContain('no máximo 5');
    }
  });
});
