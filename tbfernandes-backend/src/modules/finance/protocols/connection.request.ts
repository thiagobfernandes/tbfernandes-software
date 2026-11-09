import { RequestFields, Joi } from '../../../common/protocols';
import { ENTRY_SCOPES } from '../domain';
import type { EntryScope } from '../domain';

/** Body of POST /finance/connections/token: the scope imports will take (RN-20). */
export class TokenRequest {
  /** personal | business */
  scope: string;
}

export interface ValidTokenRequest {
  scope: EntryScope;
}

export const tokenRequestSchema = Joi.object<ValidTokenRequest>({
  scope: RequestFields.enumOf(ENTRY_SCOPES).required(),
});

export class RegisterRequest {
  itemId: string;
  scope: string;
}

export interface ValidRegisterRequest {
  itemId: string;
  scope: EntryScope;
}

export const registerRequestSchema = Joi.object<ValidRegisterRequest>({
  itemId: RequestFields.requiredText(120),
  scope: RequestFields.enumOf(ENTRY_SCOPES).required(),
});

/** What Pluggy posts to /webhooks/pluggy. Other fields are ignored. */
export class WebhookEvent {
  event: string;
  itemId?: string | null;
  clientUserId?: string | null;
  transactionIds?: string[] | null;
}

export interface ValidWebhookEvent {
  event: string;
  itemId: string | null;
  clientUserId: string | null;
  transactionIds: string[];
}

export const webhookEventSchema = Joi.object<ValidWebhookEvent>({
  event: Joi.string().required(),
  itemId: Joi.string().allow(null).default(null),
  clientUserId: Joi.string().allow(null).default(null),
  transactionIds: Joi.array().items(Joi.string()).allow(null).default([]),
});

export class AvailabilityResponse {
  enabled: boolean;
}

/** itemId is set when logging in again: the widget needs it to update that connection. */
export class ConnectTokenResponse {
  accessToken: string;
  itemId: string | null;
}

export class BankAccountResponse {
  externalId: string;
  name: string;
  /** bank | credit */
  type: string;
  balance: number | null;
  currency: string | null;
}

export class ConnectionResponse {
  id: string;
  institution: string;
  scope: string;
  status: string;
  lastSyncedAt: string | null;
  lastError: string | null;
  accounts: BankAccountResponse[];
}

export class SyncResponse {
  imported: number;
  connection: ConnectionResponse;
}
