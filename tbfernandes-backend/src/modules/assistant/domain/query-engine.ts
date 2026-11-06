import { IsoDate, YearMonths } from '../../../common/domain';
import { Answer, answerOf, Reference, reference } from './answer';
import { Format } from './format';
import {
  noteRef,
  PRIORITY_RANK,
  PRIORITY_TEXT,
  RuleBasedAssistant,
  taskRef,
} from './rule-based-assistant';
import { QuerySubject, StructuredQuery } from './structured-query';
import {
  CompanyRecord,
  ContactRecord,
  isOpenTask,
  ProjectRecord,
  TaskRecord,
  Workspace,
} from './workspace';

const DEFAULT_RANK = 2;

interface Row {
  label: string;
  details: string[];
  due: IsoDate | null;
  rank: number;
  reference: Reference;
}

interface RowInput {
  label: string;
  reference: Reference;
  details?: string[];
  due?: IsoDate | null;
  rank?: number;
}

type RowComparator = (left: Row, right: Row) => number;

interface Listing {
  singular: string;
  plural: string;
  rows: (query: StructuredQuery, data: Workspace) => Row[];
}

const rowOf = (input: RowInput): Row => ({
  label: input.label,
  reference: input.reference,
  details: input.details ?? [],
  due: input.due ?? null,
  rank: input.rank ?? DEFAULT_RANK,
});

const indexById = <T extends { id: string }>(records: T[]): Map<string, T> =>
  new Map(records.map((record) => [record.id, record]));

const findById = <T>(index: Map<string, T>, id: string | null) =>
  id == null ? undefined : index.get(id);

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function compareDue(left: Row, right: Row): number {
  if (left.due === right.due) return 0;
  if (left.due == null) return 1;
  if (right.due == null) return -1;
  return compareText(left.due, right.due);
}

const compareLabel: RowComparator = (left, right) =>
  compareText(left.label, right.label);

const compareRank: RowComparator = (left, right) => left.rank - right.rank;

const chain =
  (...comparators: RowComparator[]): RowComparator =>
  (left, right) => {
    for (const compare of comparators) {
      const result = compare(left, right);
      if (result !== 0) return result;
    }
    return 0;
  };

const COMPARATORS: Record<StructuredQuery['sort'], RowComparator> = {
  DUE_DATE: chain(compareDue, compareLabel),
  PRIORITY: chain(compareRank, compareDue, compareLabel),
  NAME: compareLabel,
};

const isWanted = (query: StructuredQuery, isFinished: boolean) =>
  !query.openOnly || !isFinished;

const statusMatches = (query: StructuredQuery, status: string) =>
  query.statuses.length === 0 || query.statuses.includes(status);

const priorityMatches = (query: StructuredQuery, priority: string) =>
  query.priorities.length === 0 || query.priorities.includes(priority);

function dueMatches(query: StructuredQuery, due: IsoDate | null): boolean {
  const { dueFrom, dueTo } = query;
  if (dueFrom == null && dueTo == null) return true;
  if (due == null) return false;
  return (dueFrom == null || due >= dueFrom) && (dueTo == null || due <= dueTo);
}

const nameMatches = (wanted: string, name: string | null | undefined) =>
  wanted === '' || Format.fold(name ?? '').includes(Format.fold(wanted));

function textMatches(
  query: StructuredQuery,
  ...fields: (string | null | undefined)[]
): boolean {
  const haystack = Format.fold(fields.map((field) => field ?? '').join(' '));
  return Format.fold(query.text)
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

const formatRow = (row: Row) =>
  row.details.length === 0
    ? `- **${row.label}**`
    : `- **${row.label}** · ${row.details.join(' · ')}`;

function summary(
  listing: Listing,
  query: StructuredQuery,
  rows: Row[],
  shown: Row[],
): string {
  const noun = rows.length === 1 ? listing.singular : listing.plural;
  if (rows.length === 0)
    return `Não encontrei ${listing.plural} com esses critérios.`;
  if (query.aggregate === 'COUNT')
    return `Você tem ${rows.length} ${noun} com esses critérios.`;
  const heading =
    rows.length > shown.length
      ? `Encontrei ${rows.length} ${noun}. Mostrando ${shown.length}:`
      : `Encontrei ${rows.length} ${noun}:`;
  return [heading, ...shown.map(formatRow)].join('\n');
}

function listingAnswer(
  query: StructuredQuery,
  listing: Listing,
  data: Workspace,
): Answer {
  const rows = listing.rows(query, data).sort(COMPARATORS[query.sort]);
  const shown = rows.slice(0, query.limit);
  const text = summary(listing, query, rows, shown);
  const references = shown.map((row) => row.reference);
  return answerOf(text, references, 'query', query);
}

function cashFlowAnswer(query: StructuredQuery, data: Workspace): Answer {
  const month = data.month.month;
  const heading =
    month === YearMonths.of(data.today)
      ? 'Neste mês:'
      : `Em ${Format.month(month)}:`;
  const money = RuleBasedAssistant.money(data.month, heading);
  return answerOf(money.text, money.references, 'query', query);
}

function taskRow(task: TaskRecord, today: IsoDate): Row {
  const details = [
    `prioridade ${PRIORITY_TEXT[task.priority] ?? task.priority}`,
  ];
  if (task.dueDate != null) details.push(Format.due(task.dueDate, today));
  if (task.status === 'blocked') details.push('bloqueada');
  return rowOf({
    label: task.title,
    details,
    due: task.dueDate,
    reference: taskRef(task.title),
    rank: PRIORITY_RANK[task.priority] ?? DEFAULT_RANK,
  });
}

function taskRows(query: StructuredQuery, data: Workspace): Row[] {
  const projects = indexById(data.projects);
  const companies = indexById(data.companies);
  const placeMatches = (task: TaskRecord) => {
    const project = findById(projects, task.projectId);
    const company = findById(companies, project?.companyId ?? null);
    return (
      nameMatches(query.project, project?.name) &&
      nameMatches(query.company, company?.name)
    );
  };
  return data.tasks
    .filter((task) => isWanted(query, !isOpenTask(task)))
    .filter((task) => statusMatches(query, task.status))
    .filter((task) => priorityMatches(query, task.priority))
    .filter((task) => dueMatches(query, task.dueDate))
    .filter((task) => textMatches(query, task.title, task.description))
    .filter(placeMatches)
    .map((task) => taskRow(task, data.today));
}

function projectRow(project: ProjectRecord, today: IsoDate): Row {
  return rowOf({
    label: project.name,
    details:
      project.dueDate == null ? [] : [Format.due(project.dueDate, today)],
    due: project.dueDate,
    reference: reference(
      'Projeto',
      project.name,
      `/projects/view?id=${project.id}`,
    ),
  });
}

function projectRows(query: StructuredQuery, data: Workspace): Row[] {
  const companies = indexById(data.companies);
  const companyName = (project: ProjectRecord) =>
    findById(companies, project.companyId)?.name;
  return data.projects
    .filter((project) => isWanted(query, project.status === 'completed'))
    .filter((project) => statusMatches(query, project.status))
    .filter((project) => dueMatches(query, project.dueDate))
    .filter((project) => nameMatches(query.project, project.name))
    .filter((project) => nameMatches(query.company, companyName(project)))
    .filter((project) => textMatches(query, project.name, project.nextDelivery))
    .map((project) => projectRow(project, data.today));
}

const companyRow = (company: CompanyRecord): Row =>
  rowOf({
    label: company.name,
    reference: reference(
      'Empresa',
      company.name,
      `/companies/view?id=${company.id}`,
    ),
  });

function companyRows(query: StructuredQuery, data: Workspace): Row[] {
  return data.companies
    .filter((company) => statusMatches(query, company.status))
    .filter((company) => nameMatches(query.company, company.name))
    .filter((company) => textMatches(query, company.name))
    .map(companyRow);
}

function linkedToNamedProject(
  query: StructuredQuery,
  data: Workspace,
): (record: { projectIds: string[] }) => boolean {
  if (query.project === '') return () => true;
  const namedIds = new Set(
    data.projects
      .filter((project) => nameMatches(query.project, project.name))
      .map((project) => project.id),
  );
  return (record) => record.projectIds.some((id) => namedIds.has(id));
}

function noteRows(query: StructuredQuery, data: Workspace): Row[] {
  return data.notes
    .filter(linkedToNamedProject(query, data))
    .filter((note) => textMatches(query, note.title, note.body, ...note.tags))
    .map((note) => rowOf({ label: note.title, reference: noteRef(note) }));
}

function snippetRows(query: StructuredQuery, data: Workspace): Row[] {
  return data.snippets
    .filter(linkedToNamedProject(query, data))
    .filter((snippet) =>
      textMatches(query, snippet.title, snippet.explanation, ...snippet.tags),
    )
    .map((snippet) =>
      rowOf({
        label: snippet.title,
        reference: reference('Snippet', snippet.title, '/knowledge/snippets'),
      }),
    );
}

function goalRows(query: StructuredQuery, data: Workspace): Row[] {
  return data.goals
    .filter((goal) => isWanted(query, goal.status === 'completed'))
    .filter((goal) => statusMatches(query, goal.status))
    .filter((goal) => textMatches(query, goal.name))
    .map((goal) =>
      rowOf({
        label: goal.name,
        details: [`${goal.percent}%`],
        reference: reference('Meta', goal.name, `/goals/view?id=${goal.id}`),
      }),
    );
}

function studyRows(query: StructuredQuery, data: Workspace): Row[] {
  return data.studies
    .filter((study) => isWanted(query, study.status === 'completed'))
    .filter((study) => statusMatches(query, study.status))
    .filter((study) => dueMatches(query, study.dueDate))
    .filter((study) => textMatches(query, study.name, study.nextActivity))
    .map((study) =>
      rowOf({
        label: study.name,
        details: Format.present(study.nextActivity) ? [study.nextActivity] : [],
        due: study.dueDate,
        reference: reference('Aprendizado', study.name, '/learning'),
      }),
    );
}

function purchaseRows(query: StructuredQuery, data: Workspace): Row[] {
  return data.purchases
    .filter((purchase) => isWanted(query, purchase.status === 'bought'))
    .filter((purchase) => statusMatches(query, purchase.status))
    .filter((purchase) => textMatches(query, purchase.name))
    .map((purchase) =>
      rowOf({
        label: purchase.name,
        details: [
          purchase.ready
            ? 'pronta para comprar'
            : `${Format.brl(purchase.missing)} faltando`,
        ],
        reference: reference('Finanças', purchase.name, '/finance/purchases'),
      }),
    );
}

function contactRow(contact: ContactRecord, today: IsoDate): Row {
  const details: string[] = [];
  if (Format.present(contact.role)) details.push(contact.role);
  if (contact.nextContact != null)
    details.push(Format.due(contact.nextContact, today));
  return rowOf({
    label: contact.name,
    details,
    due: contact.nextContact,
    reference: reference(
      'Contato',
      contact.name,
      `/contacts?contact=${contact.id}`,
    ),
  });
}

function contactRows(query: StructuredQuery, data: Workspace): Row[] {
  return data.contacts
    .filter((contact) => dueMatches(query, contact.nextContact))
    .filter((contact) => nameMatches(query.company, contact.companyName))
    .filter((contact) =>
      textMatches(query, contact.name, contact.role, contact.companyName),
    )
    .map((contact) => contactRow(contact, data.today));
}

const LISTINGS: Record<Exclude<QuerySubject, 'CASH_FLOW'>, Listing> = {
  TASKS: { singular: 'tarefa', plural: 'tarefas', rows: taskRows },
  PROJECTS: { singular: 'projeto', plural: 'projetos', rows: projectRows },
  COMPANIES: { singular: 'empresa', plural: 'empresas', rows: companyRows },
  NOTES: { singular: 'nota', plural: 'notas', rows: noteRows },
  SNIPPETS: { singular: 'snippet', plural: 'snippets', rows: snippetRows },
  GOALS: { singular: 'meta', plural: 'metas', rows: goalRows },
  STUDIES: { singular: 'estudo', plural: 'estudos', rows: studyRows },
  PURCHASES: {
    singular: 'compra planejada',
    plural: 'compras planejadas',
    rows: purchaseRows,
  },
  CONTACTS: { singular: 'contato', plural: 'contatos', rows: contactRows },
};

export const QueryEngine = {
  run(query: StructuredQuery, data: Workspace): Answer {
    if (query.subject === 'CASH_FLOW') return cashFlowAnswer(query, data);
    return listingAnswer(query, LISTINGS[query.subject], data);
  },
};
