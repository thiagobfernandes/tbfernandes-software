import {
  BusinessRuleViolationError,
  InvalidArgumentError,
} from '../../../common/domain';
import { Goal, GoalDetails } from './goal/goal';
import { GoalProgresses } from './goal/goal-progress';
import { Decimals, Indicators } from './goal/indicator';
import { Milestone } from './milestone/milestone';

const details: GoalDetails = {
  name: 'Ship MVP',
  description: null,
  area: 'CAREER',
  status: null,
  priority: null,
  currentState: null,
  desiredResult: 'Done',
  doneCriteria: null,
  dueDate: null,
  indicator: null,
  parentId: null,
};

const indicator = (current: number, target: number, unit = 'features') => ({
  label: 'Features',
  current: Decimals.hundredths(current),
  target: Decimals.hundredths(target),
  unit,
});

const milestone = (done: boolean) =>
  Milestone.create('m', 'o1', {
    goalId: 'g',
    title: 'Step',
    dueDate: null,
    done,
  });

describe('Goal', () => {
  it('starts planned with normal priority', () => {
    const goal = Goal.create('g', 'o1', details);
    expect(goal.status).toBe('PLANNED');
    expect(goal.priority).toBe('NORMAL');
  });

  it('cannot be its own sub-goal (RN-19)', () => {
    expect(() => Goal.create('g', 'o1', { ...details, parentId: 'g' })).toThrow(
      BusinessRuleViolationError,
    );
  });

  it('needs a positive indicator target and records progress only with one (RN-21)', () => {
    expect(() =>
      Goal.create('g', 'o1', { ...details, indicator: indicator(1, 0) }),
    ).toThrow(InvalidArgumentError);
    expect(() => Goal.create('g', 'o1', details).recordProgress(500)).toThrow(
      'A meta não tem indicador para atualizar',
    );
    const goal = Goal.create('g', 'o1', {
      ...details,
      indicator: indicator(3, 8),
    });
    goal.recordProgress(500);
    expect(goal.details.indicator?.current).toBe(500);
  });

  it('is activated and counted by a completed linked task (GOL-05)', () => {
    const goal = Goal.create('g', 'o1', {
      ...details,
      indicator: indicator(0, 10, 'Tasks'),
    });
    expect(goal.linkedTaskCompleted()).toBe(true);
    expect(goal.status).toBe('ACTIVE');
    expect(goal.details.indicator?.current).toBe(100);

    const active = Goal.create('g', 'o1', { ...details, status: 'ACTIVE' });
    expect(active.linkedTaskCompleted()).toBe(false);
  });
});

describe('Decimals', () => {
  it('rounds half away from zero like numeric(14,2)', () => {
    expect(Decimals.hundredths(7.245)).toBe(725);
    expect(Decimals.hundredths('-2.5')).toBe(-250);
    expect(Decimals.hundredths(-0.005)).toBe(-1);
    expect(Decimals.toText(-1050)).toBe('-10.50');
  });
});

describe('GoalProgresses', () => {
  const goal = (d: Partial<GoalDetails> = {}) =>
    Goal.create('g', 'o1', { ...details, ...d });

  it('uses the indicator first, rounding half up and capping at 100', () => {
    expect(
      GoalProgresses.of(goal({ indicator: indicator(1, 8) }), [], []),
    ).toEqual({
      percent: 13,
      basis: 'Features',
    });
    expect(Indicators.roundedPercent(indicator(12, 8))).toBe(100);
    expect(Indicators.roundedPercent(indicator(-1, 8))).toBe(0);
  });

  it('then milestones, then linked tasks without the canceled ones', () => {
    expect(
      GoalProgresses.of(
        goal(),
        [milestone(true), milestone(false), milestone(false)],
        [],
      ),
    ).toEqual({ percent: 33, basis: '1/3 marcos' });
    expect(GoalProgresses.of(goal(), [], ['done', 'todo', 'canceled'])).toEqual(
      {
        percent: 50,
        basis: '1/2 tarefas',
      },
    );
    expect(GoalProgresses.of(goal(), [], [])).toEqual({
      percent: 0,
      basis: 'Ainda sem medida de progresso',
    });
    expect(
      GoalProgresses.of(goal({ status: 'COMPLETED' }), [], ['todo']),
    ).toEqual({
      percent: 100,
      basis: 'Concluída',
    });
  });
});
