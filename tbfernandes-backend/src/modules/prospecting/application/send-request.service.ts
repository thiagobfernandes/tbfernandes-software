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
import { WorkerChannel, WorkerEvent, WorkerPresence } from './worker-channel';

export interface SendRequestView {
  request: SendRequest;
  lead: Lead;
}

const optedOut = () =>
  new BusinessRuleViolationError(
    'RN-35',
    'Este lead pediu para não receber mensagens',
  );

/**
 * RF-PRS-05/06: messages the worker asks to send, approved by the user or after an hour
 * (RN-37), and the user's own messages. The worker is told only after the commit, so the
 * request it claims next is already saved (open screens hear of it from the controllers).
 */
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
  async decide(id: string, status: SendRequestStatus): Promise<SendRequest> {
    const ownerId = this.owner.currentOwnerId();
    const saved = await this.uow.run(async () => {
      const request = await this.find(ownerId, id);
      if (status === 'APPROVED') request.approve();
      else if (status === 'CANCELLED') request.cancel(this.clock.now());
      else
        throw new BusinessRuleViolationError(
          'RN-37',
          'Escolha enviar agora ou não enviar',
        );
      return this.requests.save(request);
    });
    this.told(ownerId, {
      type: status === 'APPROVED' ? 'send' : 'cancel',
      requestId: id,
    });
    return saved;
  }

  /** The user's own message; the worker sends it as soon as it is connected. */
  async sendManual(leadId: string, body: string): Promise<SendRequest> {
    const ownerId = this.owner.currentOwnerId();
    const request = await this.uow.run(async () => {
      const lead = await this.leads.findById(ownerId, leadId);
      if (!lead) throw new NotFoundError('O lead', leadId);
      if (lead.details.status === 'OPTED_OUT') throw optedOut();
      return this.requests.create(
        SendRequest.manual(
          this.ids.forNewAggregate(),
          ownerId,
          { leadId, body },
          this.clock.now(),
        ),
      );
    });
    this.told(ownerId, { type: 'send', requestId: request.id });
    return request;
  }

  presence(): WorkerPresence {
    return this.channel.presence(this.owner.currentOwnerId());
  }

  // The worker (no session: the owner comes from the caller)

  /** Asks to send; repeating it returns the same request, unless the last one failed. */
  async ask(
    ownerId: string,
    externalId: string,
    stage: SendableStage,
    body: string,
  ): Promise<SendRequestView> {
    const view = await this.uow.run(async () => {
      const lead = await this.leadOf(ownerId, externalId);
      const latest = await this.requests.findLatest(ownerId, lead.id, stage);
      if (latest && latest.details.status !== 'FAILED')
        return { request: latest, lead };
      if (lead.details.status === 'OPTED_OUT') throw optedOut();
      const request = SendRequest.create(
        this.ids.newId(),
        ownerId,
        { leadId: lead.id, stage, body },
        this.clock.now(),
      );
      return {
        request: await this.requests.create(request),
        lead,
        created: true,
      };
    });
    return view;
  }

  async ready(ownerId: string): Promise<SendRequestView[]> {
    const now = this.clock.now();
    const open = (await this.requests.findOpen(ownerId)).filter((request) =>
      request.isReady(now),
    );
    const views: SendRequestView[] = [];
    for (const request of open) {
      const lead = await this.leads.findById(ownerId, request.details.leadId);
      if (lead) views.push({ request, lead });
    }
    return views;
  }

  async claim(ownerId: string, id: string): Promise<SendRequestView> {
    const outcome = await this.uow.run(async () => {
      const request = await this.find(ownerId, id);
      const lead = await this.leads.findById(ownerId, request.details.leadId);
      if (!lead) throw new NotFoundError('O lead', request.details.leadId);
      if (lead.details.status === 'OPTED_OUT') {
        request.cancel(this.clock.now());
        await this.requests.save(request);
        return null;
      }
      request.claim(this.clock.now());
      return { request: await this.requests.save(request), lead };
    });
    if (!outcome) throw optedOut();
    return outcome;
  }

  async finish(
    ownerId: string,
    id: string,
    sent: boolean,
    error: string | null,
  ): Promise<SendRequest> {
    const saved = await this.uow.run(async () => {
      const request = await this.find(ownerId, id);
      request.finish(sent, error, this.clock.now());
      return this.requests.save(request);
    });
    return saved;
  }

  private told(ownerId: string, event: WorkerEvent): void {
    this.channel.publish(ownerId, event);
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
