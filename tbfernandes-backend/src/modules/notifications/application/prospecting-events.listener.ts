import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ProspectingEvents } from '../../prospecting';
import type {
  OptedOut,
  ReplyReceived,
  SendFailed,
  SendRequested,
} from '../../prospecting';
import { NotificationService } from './notification.service';

const leadHref = (leadId: string) => `/prospecting?lead=${leadId}`;

const stageNames: Record<string, string> = {
  first: '1ª mensagem',
  follow_up_1: 'Follow-up 1',
  follow_up_2: 'Follow-up 2',
};

/** RF-NTF-02: what happens in prospecting becomes a notification. */
@Injectable()
export class ProspectingEventsListener {
  constructor(private readonly notifications: NotificationService) {}

  @OnEvent(ProspectingEvents.sendRequested, { async: true, promisify: true })
  async sendRequested(event: SendRequested): Promise<void> {
    await this.notifications.notify(event.ownerId, {
      kind: 'PROSPECTING_APPROVAL',
      title: `${stageNames[event.stage] ?? 'Mensagem'} para ${event.leadName} aguarda você`,
      body: 'Envie agora ou cancele. Sem decisão, sai sozinha em 1 hora.',
      href: leadHref(event.leadId),
      key: `approval:${event.requestId}`,
    });
  }

  @OnEvent(ProspectingEvents.replyReceived, { async: true, promisify: true })
  async replyReceived(event: ReplyReceived): Promise<void> {
    await this.notifications.notify(event.ownerId, {
      kind: 'PROSPECTING_REPLY',
      title: `${event.leadName} respondeu`,
      body: event.body,
      href: leadHref(event.leadId),
      key: `reply:${event.leadId}:${event.body.slice(0, 60)}:${Date.now()}`,
    });
  }

  @OnEvent(ProspectingEvents.optedOut, { async: true, promisify: true })
  async optedOut(event: OptedOut): Promise<void> {
    await this.notifications.notify(event.ownerId, {
      kind: 'PROSPECTING_OPT_OUT',
      title: `${event.leadName} pediu para não receber mensagens`,
      body: 'O envio para esse lead foi bloqueado.',
      href: leadHref(event.leadId),
      key: `opt-out:${event.leadId}`,
    });
  }

  @OnEvent(ProspectingEvents.sendFailed, { async: true, promisify: true })
  async sendFailed(event: SendFailed): Promise<void> {
    await this.notifications.notify(event.ownerId, {
      kind: 'PROSPECTING_FAILED',
      title: `A mensagem para ${event.leadName} não saiu`,
      body: event.error,
      href: leadHref(event.leadId),
      key: `failed:${event.leadId}:${Date.now()}`,
    });
  }
}
