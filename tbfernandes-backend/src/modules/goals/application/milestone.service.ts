import { Injectable } from '@nestjs/common';
import {
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import { NotFoundError } from '../../../common/domain';
import { Milestone, MilestoneDetails, MilestoneRepository } from '../domain';
import { GoalService } from './goal.service';

/** Milestones of a goal (RF-GOL-03). */
@Injectable()
export class MilestoneService {
  constructor(
    private readonly milestones: MilestoneRepository,
    private readonly goals: GoalService,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly uow: UnitOfWork,
  ) {}

  create(details: MilestoneDetails): Promise<Milestone> {
    return this.uow.run(async () => {
      await this.goals.get(details.goalId);
      return this.milestones.create(
        Milestone.create(
          this.ids.forNewAggregate(),
          this.owner.currentOwnerId(),
          details,
        ),
      );
    });
  }

  update(id: string, details: MilestoneDetails): Promise<Milestone> {
    return this.uow.run(async () => {
      const milestone = await this.get(id);
      await this.goals.get(details.goalId);
      milestone.update(details);
      return this.milestones.save(milestone);
    });
  }

  delete(id: string): Promise<void> {
    return this.uow.run(async () => this.milestones.delete(await this.get(id)));
  }

  async get(id: string): Promise<Milestone> {
    const milestone = await this.milestones.findById(
      this.owner.currentOwnerId(),
      id,
    );
    if (!milestone) throw new NotFoundError('O marco', id);
    return milestone;
  }

  list(goalId: string | null): Promise<Milestone[]> {
    return this.milestones.findAll(this.owner.currentOwnerId(), goalId);
  }
}
