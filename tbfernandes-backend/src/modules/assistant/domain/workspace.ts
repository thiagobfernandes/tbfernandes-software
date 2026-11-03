import { IsoDate, YearMonth } from '../../../common/domain';

// The records the assistant reads, as the other modules' public APIs hand them out. They are
// declared here so the domain stays free of other modules; the lookups' views match them.

export interface CompanyRecord {
  id: string;
  name: string;
  status: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  status: string;
  companyId: string | null;
  goalId: string | null;
  dueDate: IsoDate | null;
  nextDelivery: string | null;
}

export interface TaskRecord {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  projectId: string | null;
  goalId: string | null;
  dueDate: IsoDate | null;
}

export interface NoteRecord {
  id: string;
  title: string;
  body: string;
  tags: string[];
  projectIds: string[];
  taskIds: string[];
}

export interface SnippetRecord {
  id: string;
  title: string;
  explanation: string | null;
  tags: string[];
  projectIds: string[];
  taskIds: string[];
}

export interface GoalRecord {
  id: string;
  name: string;
  status: string;
  parentId: string | null;
  percent: number;
  basis: string;
}

export interface StudyRecord {
  id: string;
  name: string;
  status: string;
  goalId: string | null;
  dueDate: IsoDate | null;
  nextActivity: string | null;
}

/** Amounts in reais. */
export interface PurchaseRecord {
  id: string;
  name: string;
  status: string;
  goalId: string | null;
  estimated: number;
  reserved: number;
  missing: number;
  ready: boolean;
  months: number | null;
  onTime: boolean | null;
}

/** Totals in reais per scope; never added together (RN-12). */
export interface MonthRecord {
  month: YearMonth;
  personalIncome: number;
  personalExpense: number;
  businessIncome: number;
  businessExpense: number;
}

export interface ContactRecord {
  id: string;
  name: string;
  role: string | null;
  companyId: string | null;
  companyName: string | null;
  nextContact: IsoDate | null;
}

/**
 * Read-only snapshot of one owner's data, built from the other modules' public APIs. The
 * answers and the graph are pure functions of it.
 */
export interface Workspace {
  today: IsoDate;
  companies: CompanyRecord[];
  projects: ProjectRecord[];
  tasks: TaskRecord[];
  notes: NoteRecord[];
  snippets: SnippetRecord[];
  goals: GoalRecord[];
  studies: StudyRecord[];
  purchases: PurchaseRecord[];
  month: MonthRecord;
  contacts: ContactRecord[];
}

export const isOpenTask = (t: TaskRecord) =>
  t.status !== 'done' && t.status !== 'canceled';
