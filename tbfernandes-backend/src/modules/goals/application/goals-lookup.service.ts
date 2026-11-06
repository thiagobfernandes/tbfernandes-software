import { Injectable } from '@nestjs/common';
import { WorkLookup } from '../../work';
import {
  GoalProgresses,
  GoalRepository,
  Milestone,
  MilestoneRepository,
} from '../domain';
import { GoalsLookup, GoalView } from '../goals.lookup';

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
    for (const milestone of milestones) {
      const goalId = milestone.details.goalId;
      byGoal.set(goalId, [...(byGoal.get(goalId) ?? []), milestone]);
    }
    return goals.map((goal) => {
      const projectIds = new Set(
        projects
          .filter((project) => project.goalId === goal.id)
          .map((project) => project.id),
      );
      const linked = tasks
        .filter(
          (task) =>
            task.goalId === goal.id ||
            (task.projectId != null && projectIds.has(task.projectId)),
        )
        .map((task) => task.status);
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
