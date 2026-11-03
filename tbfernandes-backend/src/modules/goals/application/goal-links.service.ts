import { Injectable } from '@nestjs/common';
import { OwnerContext } from '../../../common/application';
import { FinanceLookup } from '../../finance';
import type { PurchaseView } from '../../finance';
import { LearningLookup } from '../../learning';
import type { StudyView } from '../../learning';
import { WorkLookup } from '../../work';
import type { ProjectView, TaskView } from '../../work';
import { GoalService } from './goal.service';

export interface GoalLinks {
  projects: ProjectView[];
  tasks: TaskView[];
  studies: StudyView[];
  purchases: PurchaseView[];
}

/**
 * GOL-04: what points to a goal, read through the other modules' public lookups. Goals
 * depends on work, learning and finance, never the other way round.
 */
@Injectable()
export class GoalLinksService {
  constructor(
    private readonly goals: GoalService,
    private readonly work: WorkLookup,
    private readonly learning: LearningLookup,
    private readonly finance: FinanceLookup,
    private readonly owner: OwnerContext,
  ) {}

  async linksOf(goalId: string): Promise<GoalLinks> {
    await this.goals.get(goalId);
    const ownerId = this.owner.currentOwnerId();
    const [projects, tasks, studies, purchases] = await Promise.all([
      this.work.projects(ownerId),
      this.work.tasks(ownerId),
      this.learning.studies(ownerId),
      this.finance.purchases(ownerId),
    ]);
    const linked = <T extends { goalId: string | null }>(items: T[]) =>
      items.filter((item) => item.goalId === goalId);
    return {
      projects: linked(projects),
      tasks: linked(tasks),
      studies: linked(studies),
      purchases: linked(purchases),
    };
  }
}
