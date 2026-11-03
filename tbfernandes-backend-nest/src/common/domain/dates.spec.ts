import { IsoDates, YearMonths } from './dates';

describe('IsoDates', () => {
  it('adds days across months and leap years', () => {
    expect(IsoDates.plusDays('2028-02-27', 3)).toBe('2028-03-01');
    expect(IsoDates.plusDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('YearMonths', () => {
  it('moves across years and knows the last day', () => {
    expect(YearMonths.plusMonths('2026-11', 3)).toBe('2027-02');
    expect(YearMonths.plusMonths('2026-01', -1)).toBe('2025-12');
    expect(YearMonths.lastDay('2028-02')).toBe('2028-02-29');
    expect(YearMonths.of('2031-03-05')).toBe('2031-03');
  });
});
