import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UnitOfWork } from '../../../common/application';
import { WorkEvents } from '../../work';
import type { TaskCompleted } from '../../work';
import { GoalRepository } from '../domain';

/** GOL-05: a completed task moves its goal forward (see Goal.linkedTaskCompleted). */
@Injectable()
export class TaskCompletedListener {
  constructor(
    private readonly goals: GoalRepository,
    private readonly uow: UnitOfWork,
  ) {}

  @OnEvent(WorkEvents.taskCompleted, { async: true, promisify: true })
  on(event: TaskCompleted): Promise<void> {
    const goalId = event.goalId;
    if (goalId == null) return Promise.resolve();
    return this.uow.run(async () => {
      const goal = await this.goals.findById(event.ownerId, goalId);
      if (goal?.linkedTaskCompleted()) await this.goals.save(goal);
    });
  }
}
