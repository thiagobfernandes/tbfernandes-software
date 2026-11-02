import { J, Joi } from '../../../common/protocols';
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
  /** YYYY-MM-DD */
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
  name: J.requiredText(200),
  description: J.optionalText(2000),
  estimated: Joi.number().required(),
  reserved: optionalAmount(),
  monthlySaving: optionalAmount(),
  priority: J.optionalEnumOf(PURCHASE_PRIORITIES),
  desiredDate: J.optionalIsoDate(),
  goalId: J.optionalUuid(),
  status: J.optionalEnumOf(PURCHASE_STATUSES),
  paid: optionalAmount(),
});

/** Same shape as the frontend's PurchaseGoal type. */
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
  /** YYYY-MM */
  month: string | null;
  onTime: boolean | null;
}
