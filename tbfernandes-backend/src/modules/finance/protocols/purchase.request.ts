import { RequestFields, Joi } from '../../../common/protocols';
import { PURCHASE_PRIORITIES, PURCHASE_STATUSES } from '../domain';
import type { PurchasePriority, PurchaseStatus } from '../domain';

/** Body of POST and PUT /finance/purchases. Amounts in reais. */
export class PurchaseRequest {
  name: string;
  description?: string | null;
  estimated: number;
  reserved?: number | null;
  monthlySaving?: number | null;
  /** low | normal | high */
  priority?: string | null;
  desiredDate?: string | null;
  goalId?: string | null;
  /** planned | saving | bought */
  status?: string | null;
  paid?: number | null;
}

export interface ValidPurchaseRequest {
  name: string;
  description: string | null;
  estimated: number;
  reserved: number | null;
  monthlySaving: number | null;
  priority: PurchasePriority | null;
  desiredDate: string | null;
  goalId: string | null;
  status: PurchaseStatus | null;
  paid: number | null;
}

const optionalAmount = () => Joi.number().allow(null).default(null);

export const purchaseRequestSchema = Joi.object<ValidPurchaseRequest>({
  name: RequestFields.requiredText(200),
  description: RequestFields.optionalText(2000),
  estimated: Joi.number().required(),
  reserved: optionalAmount(),
  monthlySaving: optionalAmount(),
  priority: RequestFields.optionalEnumOf(PURCHASE_PRIORITIES),
  desiredDate: RequestFields.optionalIsoDate(),
  goalId: RequestFields.optionalUuid(),
  status: RequestFields.optionalEnumOf(PURCHASE_STATUSES),
  paid: optionalAmount(),
});

export class PurchaseResponse {
  id: string;
  name: string;
  description: string | null;
  estimated: number;
  reserved: number;
  monthlySaving: number | null;
  priority: string;
  desiredDate: string | null;
  goalId: string | null;
  status: string;
  paid: number | null;
}

/** FIN-04. months, month and onTime are null when there is nothing to project. */
export class ProjectionResponse {
  missing: number;
  ready: boolean;
  months: number | null;
  month: string | null;
  onTime: boolean | null;
}
