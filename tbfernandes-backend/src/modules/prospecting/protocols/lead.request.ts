import { Joi, RequestFields } from '../../../common/protocols';
import {
  LEAD_CLASSIFICATIONS,
  LEAD_STATUSES,
  LeadClassification,
  LeadStatus,
} from '../domain';

/** Body of PUT /webhooks/prospecting/leads/{externalId}, sent by the prospecting worker. */
export class LeadSyncRequest {
  name: string;
  city?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  mapsUrl?: string | null;
  /** hot, warm, cold or skip */
  classification?: string | null;
  /** new, active, replied, opted_out, no_whatsapp, done, error or converted */
  status: string;
}

export interface ValidLeadSyncRequest {
  name: string;
  city: string | null;
  whatsapp: string | null;
  instagram: string | null;
  mapsUrl: string | null;
  classification: LeadClassification | null;
  status: LeadStatus;
}

export const leadSyncRequestSchema = Joi.object<ValidLeadSyncRequest>({
  name: RequestFields.requiredText(200),
  city: RequestFields.optionalText(120),
  whatsapp: RequestFields.optionalText(40),
  instagram: RequestFields.optionalText(2000),
  mapsUrl: RequestFields.optionalText(2000),
  classification: RequestFields.optionalEnumOf(LEAD_CLASSIFICATIONS),
  status: RequestFields.enumOf(LEAD_STATUSES).required(),
});

/** Body of PUT /prospecting/leads/{id}: the user's review. */
export class LeadReviewRequest {
  status: string;
  notes?: string | null;
}

export interface ValidLeadReviewRequest {
  status: LeadStatus;
  notes: string | null;
}

export const leadReviewRequestSchema = Joi.object<ValidLeadReviewRequest>({
  status: RequestFields.enumOf(LEAD_STATUSES).required(),
  notes: RequestFields.optionalText(5000),
});

export interface LeadListQuery {
  status: LeadStatus | null;
}

export const leadListQuerySchema = Joi.object<LeadListQuery>({
  status: RequestFields.optionalEnumOf(LEAD_STATUSES),
  ...RequestFields.paging(),
});
