import {
  BusinessRuleViolationError,
  InvalidArgumentError,
} from '../../../../common/domain';
import { Appointment, AppointmentDetails } from './appointment';

const details = (
  overrides: Partial<AppointmentDetails> = {},
): AppointmentDetails => ({
  title: ' Revisão do PR ',
  date: '2026-11-06',
  startTime: '09:15:00',
  endTime: '11:00:00',
  taskId: null,
  note: '',
  ...overrides,
});

const create = (id = 'a1', overrides: Partial<AppointmentDetails> = {}) =>
  Appointment.create(id, 'o1', details(overrides));

describe('Appointment', () => {
  it('trims the title, blanks the note and adds seconds to the times', () => {
    const appointment = create('a1', { startTime: '09:15', endTime: '11:00' });
    expect(appointment.details).toEqual({
      title: 'Revisão do PR',
      date: '2026-11-06',
      startTime: '09:15:00',
      endTime: '11:00:00',
      taskId: null,
      note: null,
    });
  });

  it('ends after it starts (RN-26)', () => {
    expect(() => create('a1', { endTime: '09:15:00' })).toThrow(
      BusinessRuleViolationError,
    );
  });

  it('rejects malformed times', () => {
    expect(() => create('a1', { startTime: '25:00' })).toThrow(
      InvalidArgumentError,
    );
  });

  it('does not overlap another appointment on the same day (RN-27)', () => {
    const existing = create('a1');
    const touching = create('a2', { startTime: '11:00', endTime: '12:00' });
    const crossing = create('a3', { startTime: '10:45', endTime: '12:00' });
    const otherDay = create('a4', { date: '2026-11-07' });
    expect(() => touching.ensureNoOverlap([existing])).not.toThrow();
    expect(() => otherDay.ensureNoOverlap([existing])).not.toThrow();
    expect(() => existing.ensureNoOverlap([existing])).not.toThrow();
    expect(() => crossing.ensureNoOverlap([existing])).toThrow(
      BusinessRuleViolationError,
    );
  });
});
