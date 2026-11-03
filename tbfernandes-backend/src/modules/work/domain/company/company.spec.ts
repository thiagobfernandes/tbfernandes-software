import { InvalidArgumentError } from '../../../../common/domain';
import { Company, CompanyDetails } from './company';

const details = (overrides: Partial<CompanyDetails> = {}): CompanyDetails => ({
  name: 'Software house',
  tradeName: null,
  relationship: 'CONTRACTOR',
  status: null,
  description: null,
  startDate: '2025-03-10',
  mainContact: null,
  ...overrides,
});

describe('Company', () => {
  it('starts active', () => {
    expect(Company.create('c1', 'o1', details()).status).toBe('ACTIVE');
  });

  it('needs a name of at most 120 characters', () => {
    expect(() => Company.create('c1', 'o1', details({ name: ' ' }))).toThrow(
      InvalidArgumentError,
    );
    expect(() =>
      Company.create('c1', 'o1', details({ name: 'x'.repeat(121) })),
    ).toThrow(/120/);
  });
});
