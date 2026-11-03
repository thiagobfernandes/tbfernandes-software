import { BusinessRuleViolationError } from '../../../../common/domain';
import { Task, TaskDetails } from './task';

const NOW = new Date('2026-10-23T12:00:00Z');

function details(overrides: Partial<TaskDetails> = {}): TaskDetails {
  return {
    title: 'Write the ADR',
    description: null,
    projectId: null,
    priority: null,
    tag: null,
    startDate: null,
    dueDate: null,
    doneCriteria: null,
    checklistDone: null,
    checklistTotal: null,
    checklistItems: [],
    goalId: null,
    ...overrides,
  };
}

describe('Task', () => {
  it('records when it is completed and clears it on reopening (RN-06)', () => {
    const task = Task.create('t1', 'o1', details(), 'TODO', NOW);

    expect(task.changeStatus('DONE', NOW)).toBe(true);
    expect(task.completedAt).toEqual(NOW);

    expect(task.changeStatus('IN_PROGRESS', NOW)).toBe(false);
    expect(task.completedAt).toBeNull();
  });

  it('cannot be completed while blocked (RN-07)', () => {
    const task = Task.create('t1', 'o1', details(), 'BLOCKED', NOW);
    expect(() => task.changeStatus('DONE', NOW)).toThrow(
      BusinessRuleViolationError,
    );
    expect(() => task.changeStatus('DONE', NOW)).toThrow(/Desbloqueie/);
  });

  it('refuses a due date before the start date (RN-02)', () => {
    expect(() =>
      Task.create(
        't1',
        'o1',
        details({ startDate: '2026-10-10', dueDate: '2026-10-01' }),
        null,
        NOW,
      ),
    ).toThrow(BusinessRuleViolationError);
  });

  it('takes the progress from the items when it has them', () => {
    const task = Task.create(
      't1',
      'o1',
      details({
        checklistDone: 0,
        checklistTotal: 9,
        checklistItems: [
          { id: 'a', title: 'a', done: true },
          { id: 'b', title: 'b', done: false },
        ],
      }),
      null,
      NOW,
    );
    expect(task.progress()).toEqual({ done: 1, total: 2 });
    expect(task.status).toBe('BACKLOG');
  });

  it('checks the aggregate checklist (RN-08)', () => {
    expect(() =>
      Task.create(
        't1',
        'o1',
        details({ checklistDone: 3, checklistTotal: 2 }),
        null,
        NOW,
      ),
    ).toThrow(/RN-08|checklist/);
    expect(() =>
      Task.create(
        't1',
        'o1',
        details({ checklistDone: 1, checklistTotal: null }),
        null,
        NOW,
      ),
    ).toThrow(BusinessRuleViolationError);
  });

  it('defaults the priority and trims the text fields', () => {
    const task = Task.create(
      't1',
      'o1',
      details({ title: '  Spaced  ', tag: ' ' }),
      null,
      NOW,
    );
    expect(task.details.title).toBe('Spaced');
    expect(task.details.tag).toBeNull();
    expect(task.details.priority).toBe('NORMAL');
  });
});
