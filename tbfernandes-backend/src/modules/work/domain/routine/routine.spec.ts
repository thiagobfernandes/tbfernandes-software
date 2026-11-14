import { Routine, RoutineDetails, weekdayOf } from './routine';
import { RoutineCheck } from './routine-check';

const details = (overrides: Partial<RoutineDetails> = {}): RoutineDetails => ({
  title: 'Revisar a caixa de entrada',
  description: null,
  projectId: null,
  taskId: null,
  goalId: null,
  weekdays: [1, 2, 3, 4, 5, 6, 7],
  startTime: null,
  targetMinutes: null,
  startDate: '2026-11-01',
  active: true,
  ...overrides,
});

const routine = (overrides: Partial<RoutineDetails> = {}) =>
  Routine.create('r1', 'owner', details(overrides));

describe('Routine', () => {
  it('knows the ISO weekday of a day', () => {
    expect(weekdayOf('2026-11-09')).toBe(1);
    expect(weekdayOf('2026-11-15')).toBe(7);
  });

  it('keeps weekdays sorted and unique, and the time with seconds', () => {
    const created = routine({ weekdays: [5, 1, 5], startTime: '08:30' });
    expect(created.details.weekdays).toEqual([1, 5]);
    expect(created.details.startTime).toBe('08:30:00');
  });

  it('needs at least one valid weekday and a sane target (RN-31)', () => {
    const rn31 = expect.objectContaining({ rule: 'RN-31' });
    expect(() => routine({ weekdays: [] })).toThrow(rn31);
    expect(() => routine({ weekdays: [0 as never] })).toThrow(rn31);
    expect(() => routine({ targetMinutes: 0 })).toThrow(rn31);
    expect(() => routine({ targetMinutes: 1441 })).toThrow(rn31);
    expect(() => routine({ startTime: '25:00' })).toThrow(rn31);
  });

  it('is due only when active, started and on a chosen weekday (RN-32)', () => {
    const weekdays = routine({ weekdays: [1, 2, 3, 4, 5] });
    expect(weekdays.isDueOn('2026-11-09')).toBe(true);
    expect(weekdays.isDueOn('2026-11-08')).toBe(false);
    expect(weekdays.isDueOn('2026-10-30')).toBe(false);
    expect(routine({ active: false }).isDueOn('2026-11-09')).toBe(false);
  });
});

describe('RoutineCheck', () => {
  const today = '2026-11-10';

  it('marks a due day up to today', () => {
    const check = RoutineCheck.create(
      'c1',
      'owner',
      routine(),
      { routineId: 'ignored', date: today, note: ' feito ' },
      today,
    );
    expect(check.details).toEqual({
      routineId: 'r1',
      date: today,
      note: 'feito',
    });
  });

  it('refuses future days and days the routine is not due (RN-32)', () => {
    const rn32 = expect.objectContaining({ rule: 'RN-32' });
    const check = (date: string, overrides: Partial<RoutineDetails> = {}) =>
      RoutineCheck.create(
        'c1',
        'owner',
        routine(overrides),
        { routineId: 'r1', date, note: null },
        today,
      );
    expect(() => check('2026-11-11')).toThrow(rn32);
    expect(() => check('2026-11-08', { weekdays: [1] })).toThrow(rn32);
    expect(() => check(today, { active: false })).toThrow(rn32);
  });
});
