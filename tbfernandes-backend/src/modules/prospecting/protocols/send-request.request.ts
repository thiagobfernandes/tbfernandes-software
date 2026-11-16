import { Joi, RequestFields } from '../../../common/protocols';
import {
  ASKABLE_STAGES,
  SEND_REQUEST_STATUSES,
  SendableStage,
  SendRequestStatus,
} from '../domain';

/** Body of POST /webhooks/prospecting/leads/{externalId}/send-requests. */
export class SendAskRequest {
  /** first, follow_up_1 or follow_up_2 */
  stage: string;
  body: string;
}

export interface ValidSendAskRequest {
  stage: SendableStage;
  body: string;
}

export const sendAskRequestSchema = Joi.object<ValidSendAskRequest>({
  stage: RequestFields.enumOf(ASKABLE_STAGES).required(),
  body: RequestFields.requiredText(4000),
});

/** Body of POST /webhooks/prospecting/send-requests/{id}/result. */
export class SendResultRequest {
  sent: boolean;
  error?: string | null;
}

export interface ValidSendResultRequest {
  sent: boolean;
  error: string | null;
}

export const sendResultRequestSchema = Joi.object<ValidSendResultRequest>({
  sent: Joi.boolean().required(),
  error: RequestFields.optionalText(2000),
});

/** Body of PUT /prospecting/send-requests/{id}: approved (send now) or cancelled. */
export class SendDecisionRequest {
  status: string;
}

export interface ValidSendDecisionRequest {
  status: SendRequestStatus;
}

export const sendDecisionRequestSchema = Joi.object<ValidSendDecisionRequest>({
  status: RequestFields.enumOf(SEND_REQUEST_STATUSES).required(),
});

export interface SendRequestListQuery {
  status: SendRequestStatus | null;
}

export const sendRequestListQuerySchema = Joi.object<SendRequestListQuery>({
  status: RequestFields.optionalEnumOf(SEND_REQUEST_STATUSES),
  ...RequestFields.paging(),
});

/** Body of POST /prospecting/send-requests: a message the user writes in the chat. */
export class ManualSendRequest {
  leadId: string;
  body: string;
}

export interface ValidManualSendRequest {
  leadId: string;
  body: string;
}

export const manualSendRequestSchema = Joi.object<ValidManualSendRequest>({
  leadId: RequestFields.uuid().required(),
  body: RequestFields.requiredText(4000),
});
