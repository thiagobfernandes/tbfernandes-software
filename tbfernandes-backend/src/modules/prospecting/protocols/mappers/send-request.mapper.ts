import { toInstant } from '../../../../common/protocols/instant';
import { Lead, SendRequest } from '../../domain';
import {
  SendRequestResponse,
  WorkerPresenceResponse,
  WorkerSendRequestResponse,
} from '../send-request.response';

export const SendRequestMapper = {
  toResponse(request: SendRequest): SendRequestResponse {
    const details = request.details;
    return {
      id: request.id,
      leadId: details.leadId,
      stage: details.stage.toLowerCase(),
      body: details.body,
      status: details.status.toLowerCase(),
      requestedAt: toInstant(details.requestedAt)!,
      autoSendAt: toInstant(details.autoSendAt)!,
      resolvedAt: toInstant(details.resolvedAt),
      error: details.error,
    };
  },

  toWorkerResponse(
    request: SendRequest,
    lead: Lead,
  ): WorkerSendRequestResponse {
    return {
      ...SendRequestMapper.toResponse(request),
      externalId: lead.details.externalId,
      whatsapp: lead.details.whatsapp,
    };
  },

  toPresenceResponse(presence: {
    connected: boolean;
    lastSeenAt: Date | null;
  }): WorkerPresenceResponse {
    return {
      connected: presence.connected,
      lastSeenAt: toInstant(presence.lastSeenAt),
    };
  },
};
