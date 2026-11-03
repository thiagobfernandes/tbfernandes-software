import { Injectable } from '@nestjs/common';
import { WorkLookup } from '../../work';
import {
  GoalProgresses,
  GoalRepository,
  Milestone,
  MilestoneRepository,
} from '../domain';
import { GoalsLookup, GoalView } from '../goals.lookup';

/** GoalsLookup: goals with their computed progress. */
@Injectable()
export class GoalsLookupService extends GoalsLookup {
  constructor(
    private readonly goalRepository: GoalRepository,
    private readonly milestones: MilestoneRepository,
    private readonly work: WorkLookup,
  ) {
    super();
  }

  async goals(ownerId: string): Promise<GoalView[]> {
    const [goals, milestones, projects, tasks] = await Promise.all([
      this.goalRepository.findAll(ownerId),
      this.milestones.findAll(ownerId, null),
      this.work.projects(ownerId),
      this.work.tasks(ownerId),
    ]);
    const byGoal = new Map<string, Milestone[]>();
    for (const m of milestones) {
      const goalId = m.details.goalId;
      byGoal.set(goalId, [...(byGoal.get(goalId) ?? []), m]);
    }
    return goals.map((goal) => {
      const projectIds = new Set(
        projects.filter((p) => p.goalId === goal.id).map((p) => p.id),
      );
      const linked = tasks
        .filter(
          (t) =>
            t.goalId === goal.id ||
            (t.projectId != null && projectIds.has(t.projectId)),
        )
        .map((t) => t.status);
      const progress = GoalProgresses.of(
        goal,
        byGoal.get(goal.id) ?? [],
        linked,
      );
      return {
        id: goal.id,
        name: goal.details.name,
        status: goal.status.toLowerCase(),
        parentId: goal.details.parentId,
        percent: progress.percent,
        basis: progress.basis,
      };
    });
  }
}
