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
import { StructuredQuery } from './structured-query';
import { ContactRecord, isOpenTask, Workspace } from './workspace';

interface Row {
  label: string;
  details: string[];
  due: IsoDate | null;
  rank: number;
  reference: Reference;
}

const line = (row: Row) =>
  `- **${row.label}**${row.details.length ? ` · ${row.details.join(' · ')}` : ''}`;

/** Code-unit order, as Java's String.compareTo. */
const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

const byDue = (a: Row, b: Row) =>
  a.due === b.due
    ? 0
    : a.due == null
      ? 1
      : b.due == null
        ? -1
        : compareText(a.due, b.due);

function order(query: StructuredQuery): (a: Row, b: Row) => number {
  switch (query.sort) {
    case 'DUE_DATE':
      return (a, b) => byDue(a, b) || compareText(a.label, b.label);
    case 'PRIORITY':
      return (a, b) =>
        a.rank - b.rank || byDue(a, b) || compareText(a.label, b.label);
    case 'NAME':
      return (a, b) => compareText(a.label, b.label);
  }
}

const statusMatches = (q: StructuredQuery, status: string) =>
  q.statuses.length === 0 || q.statuses.includes(status);

const dueMatches = (q: StructuredQuery, due: IsoDate | null) => {
  if (q.dueFrom == null && q.dueTo == null) return true;
  return (
    due != null &&
    (q.dueFrom == null || due >= q.dueFrom) &&
    (q.dueTo == null || due <= q.dueTo)
  );
};

const nameMatches = (wanted: string, name: string) =>
  wanted === '' || Format.fold(name).includes(Format.fold(wanted));

/** Every word of the query's text has to appear, ignoring case and accents. */
const textMatches = (q: StructuredQuery, haystack: string) => {
  const folded = Format.fold(haystack);
  return Format.fold(q.text)
    .split(/\s+/)
    .every((word) => folded.includes(word));
};

const row = (
  label: string,
  details: string[],
  due: IsoDate | null,
  ref: Reference,
  rank = 2,
): Row => ({ label, details, due, rank, reference: ref });

/**
 * Runs a StructuredQuery over a Workspace (AST-03). Pure and read-only: the records and links
 * in the answer always come from the owner's data, never from the model.
 */
export const QueryEngine = {
  run(query: StructuredQuery, data: Workspace): Answer {
    switch (query.subject) {
      case 'CASH_FLOW':
        return cashFlow(query, data);
      case 'TASKS':
        return answer(query, 'tarefa', 'tarefas', tasks(query, data));
      case 'PROJECTS':
        return answer(query, 'projeto', 'projetos', projects(query, data));
      case 'COMPANIES':
        return answer(query, 'empresa', 'empresas', companies(query, data));
      case 'NOTES':
        return answer(query, 'nota', 'notas', notes(query, data));
      case 'SNIPPETS':
        return answer(query, 'snippet', 'snippets', snippets(query, data));
      case 'GOALS':
        return answer(query, 'meta', 'metas', goals(query, data));
      case 'STUDIES':
        return answer(query, 'estudo', 'estudos', studies(query, data));
      case 'PURCHASES':
        return answer(
          query,
          'compra planejada',
          'compras planejadas',
          purchases(query, data),
        );
      case 'CONTACTS':
        return answer(query, 'contato', 'contatos', contacts(query, data));
    }
  },
};

function cashFlow(query: StructuredQuery, data: Workspace): Answer {
  const month = data.month.month;
  const heading =
    month === YearMonths.of(data.today)
      ? 'Neste mês:'
      : `Em ${Format.month(month)}:`;
  const money = RuleBasedAssistant.money(data.month, heading);
  return answerOf(money.text, money.references, 'query', query);
}

function answer(
  query: StructuredQuery,
  singular: string,
  pluralNoun: string,
  matches: Row[],
): Answer {
  const rows = [...matches].sort(order(query));
  const shown = rows.slice(0, query.limit);
  const noun = rows.length === 1 ? singular : pluralNoun;
  let text: string;
  if (rows.length === 0)
    text = `Não encontrei ${pluralNoun} com esses critérios.`;
  else if (query.aggregate === 'COUNT')
    text = `Você tem ${rows.length} ${noun} com esses critérios.`;
  else {
    const heading =
      rows.length > shown.length
        ? `Encontrei ${rows.length} ${noun}. Mostrando ${shown.length}:`
        : `Encontrei ${rows.length} ${noun}:`;
    text = `${heading}\n${shown.map(line).join('\n')}`;
  }
  return answerOf(
    text,
    shown.map((r) => r.reference),
    'query',
    query,
  );
}

function tasks(q: StructuredQuery, data: Workspace): Row[] {
  const projects = new Map(data.projects.map((p) => [p.id, p]));
  const companies = new Map(data.companies.map((c) => [c.id, c]));
  return data.tasks
    .filter((t) => !q.openOnly || isOpenTask(t))
    .filter((t) => statusMatches(q, t.status))
    .filter(
      (t) => q.priorities.length === 0 || q.priorities.includes(t.priority),
    )
    .filter((t) => dueMatches(q, t.dueDate))
    .filter((t) => textMatches(q, `${t.title} ${t.description ?? ''}`))
    .filter((t) => {
      const project =
        t.projectId == null ? undefined : projects.get(t.projectId);
      const company =
        project?.companyId == null
          ? undefined
          : companies.get(project.companyId);
      return (
        nameMatches(q.project, project?.name ?? '') &&
        nameMatches(q.company, company?.name ?? '')
      );
    })
    .map((t) => {
      const details = [`prioridade ${PRIORITY_TEXT[t.priority] ?? t.priority}`];
      if (t.dueDate != null) details.push(Format.due(t.dueDate, data.today));
      if (t.status === 'blocked') details.push('bloqueada');
      return row(
        t.title,
        details,
        t.dueDate,
        taskRef(t.title),
        PRIORITY_RANK[t.priority] ?? 2,
      );
    });
}

function projects(q: StructuredQuery, data: Workspace): Row[] {
  const companies = new Map(data.companies.map((c) => [c.id, c]));
  return data.projects
    .filter((p) => !q.openOnly || p.status !== 'completed')
    .filter((p) => statusMatches(q, p.status))
    .filter((p) => dueMatches(q, p.dueDate))
    .filter((p) => nameMatches(q.project, p.name))
    .filter((p) =>
      nameMatches(
        q.company,
        (p.companyId != null && companies.get(p.companyId)?.name) || '',
      ),
    )
    .filter((p) => textMatches(q, `${p.name} ${p.nextDelivery ?? ''}`))
    .map((p) =>
      row(
        p.name,
        p.dueDate == null ? [] : [Format.due(p.dueDate, data.today)],
        p.dueDate,
        reference('Projeto', p.name, `/projects/view?id=${p.id}`),
      ),
    );
}

function companies(q: StructuredQuery, data: Workspace): Row[] {
  return data.companies
    .filter((c) => statusMatches(q, c.status))
    .filter((c) => nameMatches(q.company, c.name))
    .filter((c) => textMatches(q, c.name))
    .map((c) =>
      row(
        c.name,
        [],
        null,
        reference('Empresa', c.name, `/companies/view?id=${c.id}`),
      ),
    );
}

/** Ids of the projects the query names, or null when it does not filter by project. */
function projectsNamed(
  q: StructuredQuery,
  data: Workspace,
): Set<string> | null {
  if (q.project === '') return null;
  return new Set(
    data.projects
      .filter((p) => nameMatches(q.project, p.name))
      .map((p) => p.id),
  );
}

function notes(q: StructuredQuery, data: Workspace): Row[] {
  const named = projectsNamed(q, data);
  return data.notes
    .filter((n) => named == null || n.projectIds.some((id) => named.has(id)))
    .filter((n) => textMatches(q, `${n.title} ${n.body} ${n.tags.join(' ')}`))
    .map((n) => row(n.title, [], null, noteRef(n)));
}

function snippets(q: StructuredQuery, data: Workspace): Row[] {
  const named = projectsNamed(q, data);
  return data.snippets
    .filter((s) => named == null || s.projectIds.some((id) => named.has(id)))
    .filter((s) =>
      textMatches(q, `${s.title} ${s.explanation ?? ''} ${s.tags.join(' ')}`),
    )
    .map((s) =>
      row(
        s.title,
        [],
        null,
        reference('Snippet', s.title, '/knowledge/snippets'),
      ),
    );
}

function goals(q: StructuredQuery, data: Workspace): Row[] {
  return data.goals
    .filter((g) => !q.openOnly || g.status !== 'completed')
    .filter((g) => statusMatches(q, g.status))
    .filter((g) => textMatches(q, g.name))
    .map((g) =>
      row(
        g.name,
        [`${g.percent}%`],
        null,
        reference('Meta', g.name, `/goals/view?id=${g.id}`),
      ),
    );
}

function studies(q: StructuredQuery, data: Workspace): Row[] {
  return data.studies
    .filter((s) => !q.openOnly || s.status !== 'completed')
    .filter((s) => statusMatches(q, s.status))
    .filter((s) => dueMatches(q, s.dueDate))
    .filter((s) => textMatches(q, `${s.name} ${s.nextActivity ?? ''}`))
    .map((s) =>
      row(
        s.name,
        Format.present(s.nextActivity) ? [s.nextActivity] : [],
        s.dueDate,
        reference('Aprendizado', s.name, '/learning'),
      ),
    );
}

function purchases(q: StructuredQuery, data: Workspace): Row[] {
  return data.purchases
    .filter((p) => !q.openOnly || p.status !== 'bought')
    .filter((p) => statusMatches(q, p.status))
    .filter((p) => textMatches(q, p.name))
    .map((p) =>
      row(
        p.name,
        [p.ready ? 'pronta para comprar' : `${Format.brl(p.missing)} faltando`],
        null,
        reference('Finanças', p.name, '/finance/purchases'),
      ),
    );
}

function contactDetails(contact: ContactRecord, today: IsoDate): string[] {
  const details: string[] = [];
  if (Format.present(contact.role)) details.push(contact.role);
  if (contact.nextContact != null)
    details.push(Format.due(contact.nextContact, today));
  return details;
}

function contacts(q: StructuredQuery, data: Workspace): Row[] {
  return data.contacts
    .filter((c) => dueMatches(q, c.nextContact))
    .filter((c) => nameMatches(q.company, c.companyName ?? ''))
    .filter((c) =>
      textMatches(q, `${c.name} ${c.role ?? ''} ${c.companyName ?? ''}`),
    )
    .map((c) =>
      row(
        c.name,
        contactDetails(c, data.today),
        c.nextContact,
        reference('Contato', c.name, `/contacts?contact=${c.id}`),
      ),
    );
}
