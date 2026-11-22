import { Joi, RequestFields } from '../../../common/protocols';
import {
  CERTAINTIES,
  COMMITMENT_CATEGORIES,
  ENTRY_SCOPES,
  FUND_KINDS,
} from '../domain';

import type {
  Certainty,
  CommitmentCategory,
  EntryScope,
  FundKind,
  MovementKind,
  MovementSource,
  MovementStatus,
} from '../domain';

export interface ValidCommitmentRequest {
  name: string;
  category: CommitmentCategory;
  dueDay: number | null;
  startMonth: string;
  endMonth: string | null;
  total: number | null;
  cardId: string | null;
  notes: string | null;
}

export interface ValidCreateCommitmentRequest extends ValidCommitmentRequest {
  amount: number;
  certainty: Certainty;
  note: string | null;
}

export interface ValidChangeRequest {
  fromMonth: string;
  amount: number;
  active: boolean;
  certainty: Certainty;
  note: string | null;
}

export interface ValidOverrideRequest {
  amount: number;
  certainty: Certainty;
  note: string | null;
}

export interface ValidPaymentRequest {
  amount: number;
  paidOn: string;
}

export interface ValidCardRequest {
  name: string;
  scope: EntryScope;
  dueDay: number;
  monthlyEstimate: number | null;
  estimateFrom: string | null;
}

export interface ValidImportRequest {
  dueDate: string;
  csv: string;
}

export interface ValidStatementRequest {
  total: number;
  certainty: Certainty;
}

export interface ValidCardPurchaseRequest {
  description: string;
  total: number;
  installments: number;
  installmentAmount: number | null;
  firstMonth: string;
  withInterest: boolean;
}

export interface ValidClassificationRequest {
  commitmentId: string | null;
}

export interface ValidFundRequest {
  name: string;
  kind: FundKind;
  protected: boolean;
  target: number | null;
  targetMonth: string | null;
  expectedContribution: number;
  contributorName: string | null;
  purchaseId: string | null;
}

export interface ValidMovementRequest {
  date: string;
  kind: MovementKind;
  source: MovementSource;
  status: MovementStatus;
  amount: number;
  contributor: string | null;
  note: string | null;
}

export interface ValidSettingsRequest {
  safetyMargin: number;
  accountBalance: number | null;
  accountBalanceOn: string | null;
  salaryScenarios: { label: string; amount: number }[];
}

export interface PeriodQuery {
  from: string | null;
  months: number;
}

export interface MonthQuery {
  month: string | null;
}

/** A simulator operation as it arrives: `type` in lower case, amounts in reais. */
export interface OperationRequest {
  type: string;
  [field: string]: unknown;
}

export interface ValidScenarioRequest extends PeriodQuery {
  operations: OperationRequest[];
}

/** Amounts in reais in the JSON, as in the rest of the API; the mappers turn them into cents. */
const money = () => Joi.number().precision(2);
const positiveMoney = () => money().greater(0);
const certainty = () => RequestFields.enumOf(CERTAINTIES).default('CONFIRMED');
const optionalMonth = () =>
  RequestFields.yearMonth().allow(null, '').empty('').default(null);
const optionalMoney = () => positiveMoney().allow(null).default(null);
const note = () => RequestFields.optionalText(300);

const commitmentFields = {
  name: RequestFields.requiredText(120),
  category: RequestFields.enumOf(COMMITMENT_CATEGORIES).required(),
  dueDay: Joi.number().integer().min(1).max(31).allow(null).default(null),
  startMonth: RequestFields.yearMonth().required(),
  endMonth: optionalMonth(),
  total: optionalMoney(),
  cardId: RequestFields.optionalUuid(),
  notes: RequestFields.optionalText(500),
};

/** POST /finance/commitments: the details plus the first amount. */
export const createCommitmentSchema = Joi.object<ValidCreateCommitmentRequest>({
  ...commitmentFields,
  amount: positiveMoney().required(),
  certainty: certainty(),
  note: note(),
});

export const updateCommitmentSchema =
  Joi.object<ValidCommitmentRequest>(commitmentFields);

export const commitmentChangeSchema = Joi.object<ValidChangeRequest>({
  fromMonth: RequestFields.yearMonth().required(),
  amount: positiveMoney().required(),
  active: Joi.boolean().default(true),
  certainty: certainty(),
  note: note(),
});

export const monthOverrideSchema = Joi.object<ValidOverrideRequest>({
  amount: money().min(0).required(),
  certainty: certainty(),
  note: note(),
});

export const paymentSchema = Joi.object<ValidPaymentRequest>({
  amount: positiveMoney().required(),
  paidOn: RequestFields.isoDate().required(),
});

export const cardSchema = Joi.object<ValidCardRequest>({
  name: RequestFields.requiredText(120),
  scope: RequestFields.enumOf(ENTRY_SCOPES).required(),
  dueDay: Joi.number().integer().min(1).max(31).required(),
  monthlyEstimate: optionalMoney(),
  estimateFrom: optionalMonth(),
});

/** The CSV goes as text: date, title, amount (Nubank export). */
export const statementImportSchema = Joi.object<ValidImportRequest>({
  dueDate: RequestFields.isoDate().required(),
  csv: Joi.string().max(1_000_000).required(),
});

export const statementSchema = Joi.object<ValidStatementRequest>({
  total: money().min(0).required(),
  certainty: certainty(),
});

export const purchaseSchema = Joi.object<ValidCardPurchaseRequest>({
  description: RequestFields.requiredText(200),
  total: positiveMoney().required(),
  installments: Joi.number().integer().min(1).max(72).required(),
  installmentAmount: optionalMoney(),
  firstMonth: RequestFields.yearMonth().required(),
  withInterest: Joi.boolean().default(false),
});

export const classificationSchema = Joi.object<ValidClassificationRequest>({
  commitmentId: RequestFields.optionalUuid(),
});

export const fundSchema = Joi.object<ValidFundRequest>({
  name: RequestFields.requiredText(120),
  kind: RequestFields.enumOf(FUND_KINDS).required(),
  protected: Joi.boolean().default(false),
  target: optionalMoney(),
  targetMonth: optionalMonth(),
  expectedContribution: money().min(0).default(0),
  contributorName: RequestFields.optionalText(120),
  purchaseId: RequestFields.optionalUuid(),
});

export const movementSchema = Joi.object<ValidMovementRequest>({
  date: RequestFields.isoDate().required(),
  kind: RequestFields.enumOf(['DEPOSIT', 'WITHDRAWAL'] as const).required(),
  source: RequestFields.enumOf(['ACCOUNT', 'EXTERNAL'] as const).default(
    'ACCOUNT',
  ),
  status: RequestFields.enumOf(['CONFIRMED', 'EXPECTED'] as const).default(
    'CONFIRMED',
  ),
  amount: positiveMoney().required(),
  contributor: RequestFields.optionalText(120),
  note: note(),
});

export const settingsSchema = Joi.object<ValidSettingsRequest>({
  safetyMargin: money().min(0).default(0),
  accountBalance: money().allow(null).default(null),
  accountBalanceOn: RequestFields.optionalIsoDate(),
  salaryScenarios: Joi.array()
    .items(
      Joi.object({
        label: RequestFields.requiredText(60),
        amount: positiveMoney().required(),
      }),
    )
    .max(10)
    .default([]),
});

export const monthSchema = Joi.object<{ month: string }>({
  month: RequestFields.yearMonth().required(),
});

export const projectionQuerySchema = Joi.object<PeriodQuery>({
  from: RequestFields.yearMonth().default(null),
  months: Joi.number().integer().min(1).max(36).default(13),
});

export const reportQuerySchema = Joi.object<MonthQuery>({
  month: RequestFields.yearMonth().default(null),
});

const operation = (type: string, fields: Record<string, Joi.Schema>) =>
  Joi.object({ type: Joi.string().valid(type).required(), ...fields });

/** One change to try in the simulator; `type` in lower case, amounts in reais. */
const operationSchema = Joi.alternatives().try(
  operation('set_month_amount', {
    commitmentId: RequestFields.uuid().required(),
    month: RequestFields.yearMonth().required(),
    amount: money().min(0).required(),
    certainty: certainty(),
  }),
  operation('change_from', {
    commitmentId: RequestFields.uuid().required(),
    fromMonth: RequestFields.yearMonth().required(),
    amount: positiveMoney().allow(null).default(null),
    active: Joi.boolean().allow(null).default(null),
  }),
  operation('end_commitment', {
    commitmentId: RequestFields.uuid().required(),
    month: optionalMonth(),
  }),
  operation('add_one_off', {
    category: RequestFields.enumOf([
      'FREELANCE',
      'OTHER_INCOME',
      'EXTRA',
    ] as const).required(),
    name: RequestFields.requiredText(120),
    month: RequestFields.yearMonth().required(),
    amount: positiveMoney().required(),
  }),
  operation('prepay_debt', {
    commitmentId: RequestFields.uuid().required(),
    month: RequestFields.yearMonth().required(),
    amount: positiveMoney().required(),
  }),
  operation('add_purchase', {
    cardId: RequestFields.uuid().required(),
    description: RequestFields.requiredText(200),
    total: positiveMoney().required(),
    installments: Joi.number().integer().min(1).max(72).required(),
    installmentAmount: optionalMoney(),
    firstMonth: RequestFields.yearMonth().required(),
    withInterest: Joi.boolean().default(false),
  }),
  operation('change_purchase', {
    cardId: RequestFields.uuid().required(),
    purchaseId: RequestFields.uuid().required(),
    description: Joi.string().trim().max(200),
    total: positiveMoney(),
    installments: Joi.number().integer().min(1).max(72),
    installmentAmount: positiveMoney().allow(null),
    firstMonth: RequestFields.yearMonth(),
    withInterest: Joi.boolean(),
  }),
  operation('reserve_deposit', {
    fundId: RequestFields.uuid().required(),
    month: RequestFields.yearMonth().required(),
    amount: positiveMoney().required(),
  }),
  operation('set_contribution', {
    fundId: RequestFields.uuid().required(),
    amount: money().min(0).required(),
  }),
);

export const scenarioSchema = Joi.object<ValidScenarioRequest>({
  from: RequestFields.yearMonth().default(null),
  months: Joi.number().integer().min(1).max(36).default(13),
  operations: Joi.array().items(operationSchema).max(100).required(),
});
