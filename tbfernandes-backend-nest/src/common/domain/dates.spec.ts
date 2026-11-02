import { IsoDates } from './dates';

describe('IsoDates', () => {
  it('adds days across months and leap years', () => {
    expect(IsoDates.plusDays('2028-02-27', 3)).toBe('2028-03-01');
    expect(IsoDates.plusDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});
