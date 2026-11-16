import { toInstant } from '../../../../common/protocols/instant';
import {
  Lead,
  LeadMessage,
  LeadSource,
  ProspectingSummary,
} from '../../domain';
import { ValidLeadSyncRequest } from '../lead.request';
import {
  LeadMessageResponse,
  LeadResponse,
  ProspectingSummaryResponse,
} from '../lead.response';

const lowerKeys = (record: Record<string, number>) =>
  Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key.toLowerCase(), value]),
  );

export const LeadMapper = {
  toSource(externalId: string, request: ValidLeadSyncRequest): LeadSource {
    return { externalId, ...request };
  },

  toResponse(lead: Lead): LeadResponse {
    const details = lead.details;
    return {
      id: lead.id,
      externalId: details.externalId,
      name: details.name,
      city: details.city,
      whatsapp: details.whatsapp,
      instagram: details.instagram,
      mapsUrl: details.mapsUrl,
      classification: details.classification?.toLowerCase() ?? null,
      status: details.status.toLowerCase(),
      notes: details.notes,
      firstContactAt: toInstant(details.firstContactAt),
      lastMessageAt: toInstant(details.lastMessageAt),
      lastReplyAt: toInstant(details.lastReplyAt),
    };
  },

  toMessageResponse(message: LeadMessage): LeadMessageResponse {
    const details = message.details;
    return {
      id: message.id,
      leadId: details.leadId,
      direction: details.direction.toLowerCase(),
      stage: details.stage.toLowerCase(),
      body: details.body,
      sentAt: toInstant(details.sentAt)!,
    };
  },

  toSummaryResponse(summary: ProspectingSummary): ProspectingSummaryResponse {
    return {
      ...summary,
      replyRate: Math.round(summary.replyRate * 1000) / 1000,
      byStatus: lowerKeys(summary.byStatus),
      byClassification: lowerKeys(summary.byClassification),
    };
  },
};
