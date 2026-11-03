import { InvalidArgumentError } from '../../../common/domain';
import { Tags } from './tags';

describe('Tags', () => {
  it('trims, lowercases and drops blanks and repeats, keeping the order', () => {
    expect(
      Tags.normalize([' Flyway ', 'database', 'FLYWAY', '', null]),
    ).toEqual(['flyway', 'database']);
  });

  it('treats no tags as an empty list', () => {
    expect(Tags.normalize(null)).toEqual([]);
  });

  it('rejects a tag longer than 40 characters', () => {
    expect(() => Tags.normalize(['x'.repeat(41)])).toThrow(
      InvalidArgumentError,
    );
  });
});
