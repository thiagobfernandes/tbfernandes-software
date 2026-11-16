import { Injectable } from '@nestjs/common';
import { Clock, OwnerContext, UnitOfWork } from '../../../common/application';
import { NotFoundError } from '../../../common/domain';
import {
  Lead,
  LeadMessage,
  LeadMessageRepository,
  LeadRepository,
  LeadStatus,
  ProspectingSummaries,
  ProspectingSummary,
} from '../domain';

/** What the screen does with leads: read, review the outcome, delete. */
@Injectable()
export class LeadService {
  constructor(
    private readonly leads: LeadRepository,
    private readonly messages: LeadMessageRepository,
    private readonly owner: OwnerContext,
    private readonly clock: Clock,
    private readonly uow: UnitOfWork,
  ) {}

  list(status: LeadStatus | null = null): Promise<Lead[]> {
    return this.leads.findAll(this.owner.currentOwnerId(), status);
  }

  async get(id: string): Promise<Lead> {
    const lead = await this.leads.findById(this.owner.currentOwnerId(), id);
    if (!lead) throw new NotFoundError('O lead', id);
    return lead;
  }

  review(id: string, status: LeadStatus, notes: string | null): Promise<Lead> {
    return this.uow.run(async () => {
      const lead = await this.get(id);
      lead.review(status, notes);
      return this.leads.save(lead);
    });
  }

  delete(id: string): Promise<void> {
    return this.uow.run(async () => this.leads.delete(await this.get(id)));
  }

  async messagesOf(leadId: string | null): Promise<LeadMessage[]> {
    if (leadId != null) await this.get(leadId);
    return this.messages.findAll(this.owner.currentOwnerId(), leadId);
  }

  summary(): Promise<ProspectingSummary> {
    return summaryFor(
      this.owner.currentOwnerId(),
      this.leads,
      this.messages,
      this.clock,
    );
  }
}

export async function summaryFor(
  ownerId: string,
  leads: LeadRepository,
  messages: LeadMessageRepository,
  clock: Clock,
): Promise<ProspectingSummary> {
  const [allLeads, allMessages] = await Promise.all([
    leads.findAll(ownerId, null),
    messages.findAll(ownerId, null),
  ]);
  return ProspectingSummaries.of(allLeads, allMessages, clock.today(), (at) =>
    clock.dayOf(at),
  );
}
