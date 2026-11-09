import { Injectable } from '@nestjs/common';
import {
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import { IsoDate, NotFoundError } from '../../../common/domain';
import { FollowUpTasks, WorkLookup } from '../../work';
import {
  Interaction,
  InteractionDetails,
  InteractionRepository,
} from '../domain';
import { ContactService } from './contact.service';

@Injectable()
export class InteractionService {
  constructor(
    private readonly interactions: InteractionRepository,
    private readonly contacts: ContactService,
    private readonly work: WorkLookup,
    private readonly followUps: FollowUpTasks,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly uow: UnitOfWork,
  ) {}

  async create(details: InteractionDetails): Promise<Interaction> {
    const ownerId = this.owner.currentOwnerId();
    await this.contacts.get(details.contactId);
    await this.checkTask(ownerId, details.followUpTaskId);
    return this.interactions.create(
      Interaction.create(this.ids.forNewAggregate(), ownerId, details),
    );
  }

  update(id: string, details: InteractionDetails): Promise<Interaction> {
    return this.uow.run(async () => {
      const interaction = await this.get(id);
      await this.contacts.get(details.contactId);
      await this.checkTask(interaction.ownerId, details.followUpTaskId);
      interaction.update(details);
      return this.interactions.save(interaction);
    });
  }

  delete(id: string): Promise<void> {
    return this.uow.run(async () =>
      this.interactions.delete(await this.get(id)),
    );
  }

  async get(id: string): Promise<Interaction> {
    const interaction = await this.interactions.findById(
      this.owner.currentOwnerId(),
      id,
    );
    if (!interaction) throw new NotFoundError('A interação', id);
    return interaction;
  }

  list(contactId: string | null = null): Promise<Interaction[]> {
    return this.interactions.findAll(this.owner.currentOwnerId(), contactId);
  }

  /**
   * CTC-03: creates a "todo" task in work and records it on the interaction. One
   * transaction, so a second follow-up (RN-24) leaves no task behind.
   */
  createFollowUp(
    interactionId: string,
    title: string | null,
    dueDate: IsoDate | null,
  ): Promise<Interaction> {
    return this.uow.run(async () => {
      const interaction = await this.get(interactionId);
      const contact = await this.contacts.get(interaction.details.contactId);
      const taskTitle =
        title == null || title.trim() === ''
          ? `Follow-up com ${contact.details.name}`
          : title;
      const taskId = await this.followUps.create(
        taskTitle,
        interaction.details.summary,
        dueDate,
      );
      interaction.followUpCreated(taskId);
      return this.interactions.save(interaction);
    });
  }

  private async checkTask(
    ownerId: string,
    taskId: string | null,
  ): Promise<void> {
    if (taskId != null && !(await this.work.taskExists(ownerId, taskId)))
      throw new NotFoundError('A tarefa', taskId);
  }
}
