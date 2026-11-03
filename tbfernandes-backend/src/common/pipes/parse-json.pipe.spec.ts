import { BadRequestException } from '@nestjs/common';
import { ParseJsonPipe } from './parse-json.pipe';

describe('ParseJsonPipe', () => {
  const pipe = new ParseJsonPipe();

  it('parses JSON text and lets objects through', () => {
    expect(pipe.transform('{"a":1}')).toEqual({ a: 1 });
    expect(pipe.transform({ a: 1 })).toEqual({ a: 1 });
  });

  it('answers 400 for text that is not JSON', () => {
    expect(() => pipe.transform('{nope')).toThrow(BadRequestException);
  });
});
