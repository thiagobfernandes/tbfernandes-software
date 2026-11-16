import { Joi, RequestFields } from '../../../common/protocols';
import {
  MESSAGE_DIRECTIONS,
  MESSAGE_STAGES,
  MessageDirection,
  MessageStage,
} from '../domain';

/** Body of POST /webhooks/prospecting/leads/{externalId}/messages. */
export class LeadMessageRequest {
  /** outbound or inbound */
  direction: string;
  /** first, follow_up_1, follow_up_2, reply or opt_out */
  stage: string;
  body: string;
  sentAt: string;
}

export interface ValidLeadMessageRequest {
  direction: MessageDirection;
  stage: MessageStage;
  body: string;
  sentAt: Date;
}

export const leadMessageRequestSchema = Joi.object<ValidLeadMessageRequest>({
  direction: RequestFields.enumOf(MESSAGE_DIRECTIONS).required(),
  stage: RequestFields.enumOf(MESSAGE_STAGES).required(),
  body: RequestFields.requiredText(4000),
  sentAt: Joi.date().iso().required(),
});

export interface LeadMessageListQuery {
  leadId: string | null;
}

export const leadMessageListQuerySchema = Joi.object<LeadMessageListQuery>({
  leadId: RequestFields.optionalUuid(),
  ...RequestFields.paging(),
});
