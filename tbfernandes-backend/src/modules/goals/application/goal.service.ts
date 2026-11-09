import { Injectable } from '@nestjs/common';
import {
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import {
  BusinessRuleViolationError,
  NotFoundError,
} from '../../../common/domain';
import {
  Goal,
  GoalDetails,
  GoalRepository,
  Hundredths,
  SELF_PARENT_MESSAGE,
} from '../domain';

@Injectable()
export class GoalService {
  constructor(
    private readonly goals: GoalRepository,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly uow: UnitOfWork,
  ) {}

  create(details: GoalDetails): Promise<Goal> {
    return this.uow.run(async () => {
      const goal = Goal.create(
        this.ids.forNewAggregate(),
        this.owner.currentOwnerId(),
        details,
      );
      await this.checkParent(goal.id, details.parentId);
      return this.goals.create(goal);
    });
  }

  update(id: string, details: GoalDetails): Promise<Goal> {
    return this.uow.run(async () => {
      const goal = await this.get(id);
      await this.checkParent(id, details.parentId);
      goal.update(details);
      return this.goals.save(goal);
    });
  }

  recordProgress(id: string, current: Hundredths): Promise<Goal> {
    return this.uow.run(async () => {
      const goal = await this.get(id);
      goal.recordProgress(current);
      return this.goals.save(goal);
    });
  }

  /** RN-09: sub-goals and milestones are deleted with the goal. */
  delete(id: string): Promise<void> {
    return this.uow.run(async () => this.goals.delete(await this.get(id)));
  }

  async get(id: string): Promise<Goal> {
    const goal = await this.goals.findById(this.owner.currentOwnerId(), id);
    if (!goal) throw new NotFoundError('A meta', id);
    return goal;
  }

  list(): Promise<Goal[]> {
    return this.goals.findAll(this.owner.currentOwnerId());
  }

  /** RN-19: the parent exists and is not the goal itself or one of its descendants. */
  private async checkParent(
    goalId: string,
    parentId: string | null,
  ): Promise<void> {
    const seen = new Set<string>();
    let current = parentId;
    while (current != null) {
      if (current === goalId || seen.has(current))
        throw new BusinessRuleViolationError('RN-19', SELF_PARENT_MESSAGE);
      seen.add(current);
      current = (await this.get(current)).details.parentId;
    }
  }
}
