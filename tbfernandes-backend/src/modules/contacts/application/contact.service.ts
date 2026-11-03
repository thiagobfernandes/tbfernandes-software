import { Injectable } from '@nestjs/common';
import {
  Clock,
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import { IsoDates, NotFoundError } from '../../../common/domain';
import { WorkLookup } from '../../work';
import { Contact, ContactDetails, ContactRepository } from '../domain';

/** Contact use cases (RF-CTC-01, CTC-04). Talks to work only through its public API. */
@Injectable()
export class ContactService {
  constructor(
    private readonly contacts: ContactRepository,
    private readonly work: WorkLookup,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly uow: UnitOfWork,
  ) {}

  async create(details: ContactDetails): Promise<Contact> {
    const ownerId = this.owner.currentOwnerId();
    await this.checkCompany(ownerId, details.companyId);
    return this.contacts.create(
      Contact.create(this.ids.forNewAggregate(), ownerId, details),
    );
  }

  update(id: string, details: ContactDetails): Promise<Contact> {
    return this.uow.run(async () => {
      const contact = await this.get(id);
      await this.checkCompany(contact.ownerId, details.companyId);
      contact.update(details);
      return this.contacts.save(contact);
    });
  }

  delete(id: string): Promise<void> {
    return this.uow.run(async () => this.contacts.delete(await this.get(id)));
  }

  async get(id: string): Promise<Contact> {
    const contact = await this.contacts.findById(
      this.owner.currentOwnerId(),
      id,
    );
    if (!contact) throw new NotFoundError('O contato', id);
    return contact;
  }

  /** CTC-04: dueWithinDays keeps contacts whose next contact is overdue or within the window. */
  async list(dueWithinDays: number | null = null): Promise<Contact[]> {
    const all = await this.contacts.findAll(this.owner.currentOwnerId());
    if (dueWithinDays == null) return all;
    const limit = IsoDates.plusDays(this.clock.today(), dueWithinDays);
    return all
      .filter((c) => {
        const next = c.details.nextContact;
        return next != null && next <= limit;
      })
      .sort((a, b) =>
        a.details.nextContact!.localeCompare(b.details.nextContact!),
      );
  }

  private async checkCompany(
    ownerId: string,
    companyId: string | null,
  ): Promise<void> {
    if (
      companyId != null &&
      !(await this.work.companyExists(ownerId, companyId))
    )
      throw new NotFoundError('A empresa', companyId);
  }
}
