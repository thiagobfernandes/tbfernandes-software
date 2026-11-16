import { Injectable } from '@nestjs/common';
import {
  Clock,
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import {
  BusinessRuleViolationError,
  NotFoundError,
} from '../../../common/domain';
import {
  Lead,
  LeadRepository,
  SendableStage,
  SendRequest,
  SendRequestRepository,
  SendRequestStatus,
} from '../domain';
import { WorkerChannel, WorkerPresence } from './worker-channel';

export interface SendRequestView {
  request: SendRequest;
  lead: Lead;
}

/** RF-PRS-05: messages the worker asks to send, approved by the user or after an hour (RN-37). */
@Injectable()
export class SendRequestService {
  constructor(
    private readonly requests: SendRequestRepository,
    private readonly leads: LeadRepository,
    private readonly channel: WorkerChannel,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly uow: UnitOfWork,
  ) {}

  // The screen

  list(status: SendRequestStatus | null = null): Promise<SendRequest[]> {
    return this.requests.findAll(this.owner.currentOwnerId(), status);
  }

  /** approved: send now; cancelled: never send this message. */
  decide(id: string, status: SendRequestStatus): Promise<SendRequest> {
    return this.uow.run(async () => {
      const ownerId = this.owner.currentOwnerId();
      const request = await this.find(ownerId, id);
      if (status === 'APPROVED') request.approve();
      else if (status === 'CANCELLED') request.cancel(this.clock.now());
      else
        throw new BusinessRuleViolationError(
          'RN-37',
          'Escolha enviar agora ou não enviar',
        );
      const saved = await this.requests.save(request);
      this.channel.publish(ownerId, {
        type: status === 'APPROVED' ? 'send' : 'cancel',
        requestId: id,
      });
      return saved;
    });
  }

  presence(): WorkerPresence {
    return this.channel.presence(this.owner.currentOwnerId());
  }

  // The worker (no session: the owner comes from the caller)

  /** Asks to send; repeating it returns the same request, unless the last one failed. */
  ask(
    ownerId: string,
    externalId: string,
    stage: SendableStage,
    body: string,
  ): Promise<SendRequestView> {
    return this.uow.run(async () => {
      const lead = await this.leadOf(ownerId, externalId);
      const latest = await this.requests.findLatest(ownerId, lead.id, stage);
      if (latest && latest.details.status !== 'FAILED')
        return { request: latest, lead };
      if (lead.details.status === 'OPTED_OUT') {
        throw new BusinessRuleViolationError(
          'RN-35',
          'Este lead pediu para não receber mensagens',
        );
      }
      const request = SendRequest.create(
        this.ids.newId(),
        ownerId,
        { leadId: lead.id, stage, body },
        this.clock.now(),
      );
      return { request: await this.requests.create(request), lead };
    });
  }

  async ready(ownerId: string): Promise<SendRequestView[]> {
    const now = this.clock.now();
    const open = (await this.requests.findOpen(ownerId)).filter((request) =>
      request.isReady(now),
    );
    return this.withLeads(ownerId, open);
  }

  claim(ownerId: string, id: string): Promise<SendRequestView> {
    return this.uow.run(async () => {
      const request = await this.find(ownerId, id);
      const lead = await this.leads.findById(ownerId, request.details.leadId);
      if (!lead) throw new NotFoundError('O lead', request.details.leadId);
      if (lead.details.status === 'OPTED_OUT') {
        request.cancel(this.clock.now());
        await this.requests.save(request);
        throw new BusinessRuleViolationError(
          'RN-35',
          'Este lead pediu para não receber mensagens',
        );
      }
      request.claim(this.clock.now());
      return { request: await this.requests.save(request), lead };
    });
  }

  finish(
    ownerId: string,
    id: string,
    sent: boolean,
    error: string | null,
  ): Promise<SendRequest> {
    return this.uow.run(async () => {
      const request = await this.find(ownerId, id);
      request.finish(sent, error, this.clock.now());
      return this.requests.save(request);
    });
  }

  private async withLeads(
    ownerId: string,
    requests: SendRequest[],
  ): Promise<SendRequestView[]> {
    const views: SendRequestView[] = [];
    for (const request of requests) {
      const lead = await this.leads.findById(ownerId, request.details.leadId);
      if (lead) views.push({ request, lead });
    }
    return views;
  }

  private async find(ownerId: string, id: string): Promise<SendRequest> {
    const request = await this.requests.findById(ownerId, id);
    if (!request) throw new NotFoundError('O envio', id);
    return request;
  }

  private async leadOf(ownerId: string, externalId: string): Promise<Lead> {
    const lead = await this.leads.findByExternalId(ownerId, externalId);
    if (!lead) throw new NotFoundError('O lead', externalId);
    return lead;
  }
}
