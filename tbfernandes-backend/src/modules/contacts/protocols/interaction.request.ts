import { RequestFields, Joi } from '../../../common/protocols';
import { INTERACTION_KINDS, InteractionKind } from '../domain';

export class InteractionRequest {
  contactId: string;
  date: string;
  /** meeting, call, message, event or referral */
  kind: string;
  summary: string;
  followUpTaskId?: string | null;
}

export interface ValidInteractionRequest {
  contactId: string;
  date: string;
  kind: InteractionKind;
  summary: string;
  followUpTaskId: string | null;
}

export const interactionRequestSchema = Joi.object<ValidInteractionRequest>({
  contactId: RequestFields.uuid().required(),
  date: RequestFields.isoDate().required(),
  kind: RequestFields.enumOf(INTERACTION_KINDS).required(),
  summary: RequestFields.requiredText(2000),
  followUpTaskId: RequestFields.optionalUuid(),
});

export interface InteractionListQuery {
  contactId: string | null;
}

export const interactionListQuerySchema = Joi.object<InteractionListQuery>({
  contactId: RequestFields.optionalUuid(),
  ...RequestFields.paging(),
});

/** Body of POST /interactions/{id}/follow-up. Without a title: "Follow-up com <nome>". */
export class FollowUpRequest {
  title?: string | null;
  dueDate?: string | null;
}

export interface ValidFollowUpRequest {
  title: string | null;
  dueDate: string | null;
}

export const followUpRequestSchema = Joi.object<ValidFollowUpRequest>({
  title: RequestFields.optionalText(200),
  dueDate: RequestFields.optionalIsoDate(),
});
