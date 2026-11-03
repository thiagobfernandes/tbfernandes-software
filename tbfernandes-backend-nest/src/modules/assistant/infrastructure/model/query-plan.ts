import {
  QUERY_AGGREGATES,
  QUERY_SORTS,
  QUERY_SUBJECTS,
  QueryAggregate,
  QuerySort,
  QuerySubject,
  StructuredQueries,
  StructuredQuery,
} from '../../domain';

/**
 * The JSON the model has to return for a question. Every field is required and an empty
 * value means "no filter", so the schema stays simple and works with strict structured
 * outputs.
 */
export interface QueryPlan {
  answerable: boolean;
  subject: QuerySubject;
  aggregate: QueryAggregate;
  text: string;
  statuses: string[];
  priorities: string[];
  openOnly: boolean;
  project: string;
  company: string;
  dueFrom: string;
  dueTo: string;
  month: string;
  sort: QuerySort;
  limit: number;
}

const text = (description: string) => ({ type: 'string', description });
const list = (description: string) => ({
  type: 'array',
  items: { type: 'string' },
  description,
});

export const QUERY_PLAN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    answerable: {
      type: 'boolean',
      description:
        'False when no lookup answers the question: a greeting, advice, or what to focus on today',
    },
    subject: {
      type: 'string',
      enum: [...QUERY_SUBJECTS],
      description:
        'The kind of record the question is about. CASH_FLOW is the income and expense totals of a month',
    },
    aggregate: {
      type: 'string',
      enum: [...QUERY_AGGREGATES],
      description: "COUNT for 'how many' questions, otherwise LIST",
    },
    text: text('Keywords to find in names and text, empty for none'),
    statuses: list(
      'Statuses to keep, empty for all. Tasks: backlog, todo, in_progress, blocked, done, canceled. ' +
        'Projects and goals: planned, active, paused, completed. Studies: planned, in_progress, paused, completed. ' +
        'Purchases: planned, saving, bought. Companies: active, inactive, closed',
    ),
    priorities: list(
      'Task priorities to keep, empty for all: urgent, high, normal, low',
    ),
    openOnly: {
      type: 'boolean',
      description:
        "True to leave out finished or canceled records, as in 'overdue' or 'pending'",
    },
    project: text('Project name, empty for none'),
    company: text('Company name, empty for none'),
    dueFrom: text('First due date to keep as YYYY-MM-DD, empty for none'),
    dueTo: text(
      'Last due date to keep as YYYY-MM-DD, empty for none. For overdue records, yesterday',
    ),
    month: text('Month for CASH_FLOW as YYYY-MM, empty for the current month'),
    sort: {
      type: 'string',
      enum: [...QUERY_SORTS],
      description: 'DUE_DATE unless the question asks for another order',
    },
    limit: {
      type: 'integer',
      description:
        'How many records to show, from 1 to 50. 20 unless the question says otherwise',
    },
  },
  required: [
    'answerable',
    'subject',
    'aggregate',
    'text',
    'statuses',
    'priorities',
    'openOnly',
    'project',
    'company',
    'dueFrom',
    'dueTo',
    'month',
    'sort',
    'limit',
  ],
} as const;

/** The rewritten answer, as the model has to return it. */
export const ANSWER_DRAFT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: { text: { type: 'string' } },
  required: ['text'],
} as const;

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;

function oneOf<T extends string>(
  values: readonly T[],
  value: unknown,
  field: string,
): T {
  const v = typeof value === 'string' ? value.trim().toUpperCase() : value;
  if (!values.includes(v as T))
    throw new Error(`Unknown ${field}: ${String(value)}`);
  return v as T;
}

function matching(
  pattern: RegExp,
  value: unknown,
  field: string,
): string | null {
  const v = typeof value === 'string' ? value.trim() : '';
  if (v === '') return null;
  if (
    !pattern.test(v) ||
    Number.isNaN(Date.parse(pattern === MONTH ? `${v}-01` : v))
  ) {
    throw new Error(`Invalid ${field}: ${v}`);
  }
  return v;
}

const strings = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === 'string')
    : [];

export const QueryPlans = {
  /** The plan as a query the engine can run, or null when the model says no lookup answers it. Throws on a malformed plan. */
  toQuery(raw: unknown): StructuredQuery | null {
    const plan = (raw ?? {}) as Partial<Record<keyof QueryPlan, unknown>>;
    if (plan.answerable !== true) return null;
    return StructuredQueries.of({
      subject: oneOf(QUERY_SUBJECTS, plan.subject, 'subject'),
      aggregate: oneOf(QUERY_AGGREGATES, plan.aggregate ?? 'LIST', 'aggregate'),
      text: typeof plan.text === 'string' ? plan.text : '',
      statuses: strings(plan.statuses),
      priorities: strings(plan.priorities),
      openOnly: plan.openOnly === true,
      project: typeof plan.project === 'string' ? plan.project : '',
      company: typeof plan.company === 'string' ? plan.company : '',
      dueFrom: matching(DAY, plan.dueFrom, 'dueFrom'),
      dueTo: matching(DAY, plan.dueTo, 'dueTo'),
      month: matching(MONTH, plan.month, 'month'),
      sort: oneOf(QUERY_SORTS, plan.sort ?? 'DUE_DATE', 'sort'),
      limit: typeof plan.limit === 'number' ? Math.trunc(plan.limit) : 0,
    });
  },
};
