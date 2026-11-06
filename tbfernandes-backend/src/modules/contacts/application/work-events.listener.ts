import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UnitOfWork } from '../../../common/application';
import { WorkEvents } from '../../work';
import type { CompanyDeleted, TaskDeleted } from '../../work';
import { ContactRepository, InteractionRepository } from '../domain';

@Injectable()
export class WorkEventsListener {
  constructor(
    private readonly contacts: ContactRepository,
    private readonly interactions: InteractionRepository,
    private readonly uow: UnitOfWork,
  ) {}

  @OnEvent(WorkEvents.companyDeleted, { async: true, promisify: true })
  onCompanyDeleted(event: CompanyDeleted): Promise<void> {
    return this.uow.run(async () => {
      const linked = await this.contacts.findByCompany(
        event.ownerId,
        event.companyId,
      );
      for (const contact of linked) {
        contact.companyDeleted();
        await this.contacts.save(contact);
      }
    });
  }

  @OnEvent(WorkEvents.taskDeleted, { async: true, promisify: true })
  onTaskDeleted(event: TaskDeleted): Promise<void> {
    return this.uow.run(async () => {
      const linked = await this.interactions.findByFollowUpTask(
        event.ownerId,
        event.taskId,
      );
      for (const interaction of linked) {
        interaction.followUpDeleted();
        await this.interactions.save(interaction);
      }
    });
  }
}
