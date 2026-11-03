import { J, Joi } from '../../../common/protocols';
import { INTERACTION_KINDS, InteractionKind } from '../domain';

/** Body of POST and PUT /interactions. */
export class InteractionRequest {
  contactId: string;
  /** YYYY-MM-DD */
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
  contactId: J.uuid().required(),
  date: J.isoDate().required(),
  kind: J.enumOf(INTERACTION_KINDS).required(),
  summary: J.requiredText(2000),
  followUpTaskId: J.optionalUuid(),
});

export interface InteractionListQuery {
  contactId: string | null;
}

export const interactionListQuerySchema = Joi.object<InteractionListQuery>({
  contactId: J.optionalUuid(),
  ...J.paging(),
});

/** Body of POST /interactions/{id}/follow-up. Without a title: "Follow-up com <nome>". */
export class FollowUpRequest {
  title?: string | null;
  /** YYYY-MM-DD */
  dueDate?: string | null;
}

export interface ValidFollowUpRequest {
  title: string | null;
  dueDate: string | null;
}

export const followUpRequestSchema = Joi.object<ValidFollowUpRequest>({
  title: J.optionalText(200),
  dueDate: J.optionalIsoDate(),
});
