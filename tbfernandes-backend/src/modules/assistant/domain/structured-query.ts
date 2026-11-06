import {
  InvalidArgumentError,
  IsoDate,
  YearMonth,
} from '../../../common/domain';

export const QUERY_SUBJECTS = [
  'TASKS',
  'PROJECTS',
  'COMPANIES',
  'NOTES',
  'SNIPPETS',
  'GOALS',
  'STUDIES',
  'PURCHASES',
  'CONTACTS',
  'CASH_FLOW',
] as const;
export type QuerySubject = (typeof QUERY_SUBJECTS)[number];

export const QUERY_AGGREGATES = ['LIST', 'COUNT'] as const;
export type QueryAggregate = (typeof QUERY_AGGREGATES)[number];

export const QUERY_SORTS = ['DUE_DATE', 'PRIORITY', 'NAME'] as const;
export type QuerySort = (typeof QUERY_SORTS)[number];

export interface StructuredQuery {
  subject: QuerySubject;
  aggregate: QueryAggregate;
  text: string;
  statuses: string[];
  priorities: string[];
  openOnly: boolean;
  project: string;
  company: string;
  dueFrom: IsoDate | null;
  dueTo: IsoDate | null;
  month: YearMonth | null;
  sort: QuerySort;
  limit: number;
}

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;

const clean = (value: string | null | undefined) => (value ?? '').trim();
const lower = (values: string[] | null | undefined) =>
  (values ?? []).map((value) => value.trim().toLowerCase());

export const StructuredQueries = {
  of(input: {
    subject: QuerySubject | null;
    aggregate?: QueryAggregate | null;
    text?: string | null;
    statuses?: string[] | null;
    priorities?: string[] | null;
    openOnly?: boolean | null;
    project?: string | null;
    company?: string | null;
    dueFrom?: IsoDate | null;
    dueTo?: IsoDate | null;
    month?: YearMonth | null;
    sort?: QuerySort | null;
    limit?: number | null;
  }): StructuredQuery {
    if (input.subject == null)
      throw new InvalidArgumentError('A query needs a subject');
    const limit = input.limit ?? 0;
    return {
      subject: input.subject,
      aggregate: input.aggregate ?? 'LIST',
      text: clean(input.text),
      statuses: lower(input.statuses),
      priorities: lower(input.priorities),
      openOnly: input.openOnly ?? false,
      project: clean(input.project),
      company: clean(input.company),
      dueFrom: input.dueFrom ?? null,
      dueTo: input.dueTo ?? null,
      month: input.month ?? null,
      sort: input.sort ?? 'DUE_DATE',
      limit: limit <= 0 ? DEFAULT_LIMIT : Math.min(limit, MAX_LIMIT),
    };
  },
};
