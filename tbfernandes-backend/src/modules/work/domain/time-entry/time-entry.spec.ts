import { TimeEntry, TimeEntryDetails } from './time-entry';

const NOW = new Date('2026-11-09T15:00:00Z');
const at = (time: string) => new Date(`2026-11-09T${time}Z`);

const details = (
  overrides: Partial<TimeEntryDetails> = {},
): TimeEntryDetails => ({
  description: 'Revisar PR',
  projectId: null,
  taskId: null,
  startedAt: at('09:00:00'),
  endedAt: at('10:00:00'),
  note: null,
  ...overrides,
});

const entry = (id: string, overrides: Partial<TimeEntryDetails> = {}) =>
  TimeEntry.create(id, 'owner', details(overrides), NOW);

describe('TimeEntry', () => {
  it('measures finished and running entries', () => {
    expect(entry('a').durationSeconds(NOW)).toBe(3600);
    const running = entry('b', { startedAt: at('14:30:00'), endedAt: null });
    expect(running.isRunning).toBe(true);
    expect(running.durationSeconds(NOW)).toBe(1800);
  });

  it('needs the end after the start (RN-29)', () => {
    expect(() => entry('a', { endedAt: at('09:00:00') })).toThrow(
      expect.objectContaining({ rule: 'RN-29' }),
    );
  });

  it('refuses periods in the future, beyond a minute of clock skew (RN-29)', () => {
    expect(() =>
      entry('a', { startedAt: at('15:00:30'), endedAt: null }),
    ).not.toThrow();
    expect(() =>
      entry('a', { startedAt: at('15:05:00'), endedAt: null }),
    ).toThrow(expect.objectContaining({ rule: 'RN-29' }));
    expect(() => entry('a', { endedAt: at('16:00:00') })).toThrow(
      expect.objectContaining({ rule: 'RN-29' }),
    );
  });

  it('allows only one running entry (RN-28)', () => {
    const running = entry('a', { startedAt: at('14:00:00'), endedAt: null });
    const another = entry('b', { startedAt: at('14:30:00'), endedAt: null });
    expect(() => another.ensureCanCoexistWith([running], NOW)).toThrow(
      expect.objectContaining({ rule: 'RN-28' }),
    );
    expect(() => running.ensureCanCoexistWith([running], NOW)).not.toThrow();
  });

  it('refuses overlaps but accepts entries that only touch (RN-30)', () => {
    const morning = entry('a');
    expect(() =>
      entry('b', {
        startedAt: at('09:30:00'),
        endedAt: at('11:00:00'),
      }).ensureCanCoexistWith([morning], NOW),
    ).toThrow(expect.objectContaining({ rule: 'RN-30' }));
    expect(() =>
      entry('c', {
        startedAt: at('10:00:00'),
        endedAt: at('11:00:00'),
      }).ensureCanCoexistWith([morning], NOW),
    ).not.toThrow();
  });

  it('treats a running entry as lasting until now', () => {
    const running = entry('a', { startedAt: at('14:00:00'), endedAt: null });
    expect(() =>
      entry('b', {
        startedAt: at('14:30:00'),
        endedAt: at('14:45:00'),
      }).ensureCanCoexistWith([running], NOW),
    ).toThrow(expect.objectContaining({ rule: 'RN-30' }));
  });

  it('stops at the given moment', () => {
    const running = entry('a', { startedAt: at('14:00:00'), endedAt: null });
    running.stop(NOW);
    expect(running.isRunning).toBe(false);
    expect(running.details.endedAt).toEqual(NOW);
  });
});
