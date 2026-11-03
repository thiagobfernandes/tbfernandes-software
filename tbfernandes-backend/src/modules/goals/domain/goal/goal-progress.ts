import { Milestone } from '../milestone/milestone';
import { Goal } from './goal';
import { Indicators } from './indicator';

/**
 * Progress of a goal in percent (RF-GOL-05). The measurable indicator wins; without one,
 * milestones decide; without milestones, the share of finished linked tasks. Same rule as
 * the frontend's goals/lib/goal-progress.ts. basis says what the percent was measured on.
 */
export interface GoalProgress {
  percent: number;
  basis: string;
}

const percent = (part: number, whole: number) =>
  Math.round((part * 100) / whole);

export const GoalProgresses = {
  /** @param linkedTaskStatuses status (lower case) of each task that serves the goal, directly or through its projects */
  of(
    goal: Goal,
    milestones: readonly Milestone[],
    linkedTaskStatuses: readonly string[],
  ): GoalProgress {
    const d = goal.details;
    if (goal.status === 'COMPLETED')
      return { percent: 100, basis: 'Concluída' };
    if (d.indicator)
      return {
        percent: Indicators.roundedPercent(d.indicator),
        basis: d.indicator.label,
      };
    if (milestones.length) {
      const done = milestones.filter((m) => m.details.done).length;
      return {
        percent: percent(done, milestones.length),
        basis: `${done}/${milestones.length} marcos`,
      };
    }
    const counted = linkedTaskStatuses.filter((s) => s !== 'canceled');
    if (counted.length) {
      const done = counted.filter((s) => s === 'done').length;
      return {
        percent: percent(done, counted.length),
        basis: `${done}/${counted.length} tarefas`,
      };
    }
    return { percent: 0, basis: 'Ainda sem medida de progresso' };
  },
};
