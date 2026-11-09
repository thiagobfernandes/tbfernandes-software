import { Milestone } from '../milestone/milestone';
import { Goal } from './goal';
import { Indicators } from './indicator';

export interface GoalProgress {
  percent: number;
  basis: string;
}

const DONE_TASK_STATUS = 'done';
const CANCELED_TASK_STATUS = 'canceled';

const COMPLETED_PROGRESS: GoalProgress = { percent: 100, basis: 'Concluída' };
const UNMEASURED_PROGRESS: GoalProgress = {
  percent: 0,
  basis: 'Ainda sem medida de progresso',
};

const roundedPercent = (part: number, whole: number) =>
  Math.round((part * 100) / whole);

const progressFromCount = (
  doneCount: number,
  totalCount: number,
  unitLabel: string,
): GoalProgress => ({
  percent: roundedPercent(doneCount, totalCount),
  basis: `${doneCount}/${totalCount} ${unitLabel}`,
});

const completedGoalProgress = (goal: Goal): GoalProgress | null =>
  goal.status === 'COMPLETED' ? COMPLETED_PROGRESS : null;

const indicatorProgress = (goal: Goal): GoalProgress | null => {
  const { indicator } = goal.details;
  if (!indicator) return null;
  return {
    percent: Indicators.roundedPercent(indicator),
    basis: indicator.label,
  };
};

const milestoneProgress = (
  milestones: readonly Milestone[],
): GoalProgress | null => {
  if (milestones.length === 0) return null;
  const doneCount = milestones.filter(
    (milestone) => milestone.details.done,
  ).length;
  return progressFromCount(doneCount, milestones.length, 'marcos');
};

const linkedTaskProgress = (
  linkedTaskStatuses: readonly string[],
): GoalProgress | null => {
  const countedStatuses = linkedTaskStatuses.filter(
    (status) => status !== CANCELED_TASK_STATUS,
  );
  if (countedStatuses.length === 0) return null;
  const doneCount = countedStatuses.filter(
    (status) => status === DONE_TASK_STATUS,
  ).length;
  return progressFromCount(doneCount, countedStatuses.length, 'tarefas');
};

export const GoalProgresses = {
  /**
   * Progress from the first source that applies: completed status, indicator, milestones,
   * then linked tasks (canceled ones are not counted).
   *
   * @param linkedTaskStatuses status (lower case) of each task that serves the goal, directly or through its projects
   */
  of(
    goal: Goal,
    milestones: readonly Milestone[],
    linkedTaskStatuses: readonly string[],
  ): GoalProgress {
    return (
      completedGoalProgress(goal) ??
      indicatorProgress(goal) ??
      milestoneProgress(milestones) ??
      linkedTaskProgress(linkedTaskStatuses) ??
      UNMEASURED_PROGRESS
    );
  },
};
