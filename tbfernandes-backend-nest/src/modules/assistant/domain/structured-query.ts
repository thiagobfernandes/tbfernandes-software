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

/**
 * A question turned into filters over the owner's data (AST-03). It only describes what to
 * read: QueryEngine runs it over a Workspace, so nothing a language model returns can reach
 * the database or write anything (RN-20). Empty filters do not filter.
 */
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
  (values ?? []).map((v) => v.trim().toLowerCase());

export const StructuredQueries = {
  of(q: {
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
    if (q.subject == null)
      throw new InvalidArgumentError('A query needs a subject');
    const limit = q.limit ?? 0;
    return {
      subject: q.subject,
      aggregate: q.aggregate ?? 'LIST',
      text: clean(q.text),
      statuses: lower(q.statuses),
      priorities: lower(q.priorities),
      openOnly: q.openOnly ?? false,
      project: clean(q.project),
      company: clean(q.company),
      dueFrom: q.dueFrom ?? null,
      dueTo: q.dueTo ?? null,
      month: q.month ?? null,
      sort: q.sort ?? 'DUE_DATE',
      limit: limit <= 0 ? DEFAULT_LIMIT : Math.min(limit, MAX_LIMIT),
    };
  },
};
