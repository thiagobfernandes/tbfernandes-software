import { Answer, answerOf, Reference, reference } from './answer';
import { Format } from './format';
import {
  ContactRecord,
  GoalRecord,
  isOpenTask,
  MonthRecord,
  NoteRecord,
  ProjectRecord,
  PurchaseRecord,
  StudyRecord,
  TaskRecord,
  Workspace,
} from './workspace';

/** Keyword sets in English and Portuguese, since questions come in either. */
const INTENTS: Record<string, string[]> = {
  focus: [
    'today',
    'focus',
    'priorit',
    'next',
    'hoje',
    'foco',
    'fazer agora',
    'prioridade',
  ],
  overdue: ['overdue', 'late', 'atrasad', 'vencid'],
  goals: ['goal', 'meta', 'objetivo'],
  money: [
    'money',
    'finance',
    'cash',
    'spend',
    'expense',
    'income',
    'budget',
    'dinheiro',
    'finan',
    'gast',
    'saldo',
    'receita',
    'despesa',
  ],
  purchases: ['buy', 'purchase', 'afford', 'comprar', 'compra'],
  contacts: ['contact', 'follow', 'network', 'contato', 'pessoa', 'retorno'],
  learning: ['study', 'learn', 'certif', 'estud', 'aprend', 'curso'],
};

export const PRIORITY_RANK: Record<string, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};
export const PRIORITY_TEXT: Record<string, string> = {
  urgent: 'urgente',
  high: 'alta',
  normal: 'normal',
  low: 'baixa',
};
const PROJECT_STATUS_TEXT: Record<string, string> = {
  planned: 'planejado',
  active: 'ativo',
  paused: 'pausado',
  completed: 'concluído',
};

const has = (question: string, intent: string) =>
  INTENTS[intent].some((word) => question.includes(word));

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const plural = (n: number, suffix = 's') => (n > 1 ? suffix : '');

const rules = (text: string, references: Reference[]) =>
  answerOf(text, references, 'rules');

export const taskRef = (title: string) =>
  reference('Tarefa', title, `/tasks?q=${encodeURIComponent(title)}`);

export const noteRef = (note: NoteRecord) =>
  reference('Nota', note.title, `/knowledge?note=${note.id}`);

/**
 * Rule-based assistant (AST-01): the same intents, wording and references as the frontend's
 * assistant/lib/answer.ts, so the screen behaves the same with the API. Read-only by
 * construction: it only receives a Workspace snapshot (RN-20).
 */
export const RuleBasedAssistant = {
  answer(rawQuestion: string, data: Workspace): Answer {
    const question = rawQuestion.toLowerCase();
    const openTasks = data.tasks.filter(isOpenTask);
    const project = data.projects.find((p) =>
      RuleBasedAssistant.mentions(question, p.name),
    );
    if (project) return aboutProject(project, data);
    if (has(question, 'overdue')) return overdue(openTasks, data);
    if (has(question, 'focus')) return focus(openTasks, data);
    if (has(question, 'purchases')) return purchases(data.purchases);
    if (has(question, 'money'))
      return RuleBasedAssistant.money(data.month, 'Neste mês:');
    if (has(question, 'goals')) return goals(data.goals);
    if (has(question, 'contacts')) return contacts(data.contacts, data);
    if (has(question, 'learning')) return learning(data.studies);
    return search(question, data);
  },

  /**
   * Whether a fixed intent or a project name matches, so answer() would not fall back to the
   * keyword search. Open questions go to retrieval over notes and snippets (AST-04).
   */
  understands(rawQuestion: string, data: Workspace): boolean {
    const question = rawQuestion.toLowerCase();
    return (
      data.projects.some((p) =>
        RuleBasedAssistant.mentions(question, p.name),
      ) || Object.keys(INTENTS).some((intent) => has(question, intent))
    );
  },

  /** The project name as whole words, so "P" or "API" is not found inside other words. */
  mentions(question: string, name: string): boolean {
    const lower = name.toLowerCase().trim();
    return (
      lower !== '' &&
      new RegExp(
        `(?<![\\p{L}\\p{N}])${escape(lower)}(?![\\p{L}\\p{N}])`,
        'u',
      ).test(question)
    );
  },

  money(month: MonthRecord, heading: string): Answer {
    const personal = month.personalIncome - month.personalExpense;
    const business = month.businessIncome - month.businessExpense;
    const text = [
      heading,
      `- **Pessoal**: ${Format.brl(month.personalIncome)} de entrada, ${Format.brl(month.personalExpense)} de saída, saldo ${Format.brl(personal)}.`,
      `- **Empresa**: ${Format.brl(month.businessIncome)} de entrada, ${Format.brl(month.businessExpense)} de saída, saldo ${Format.brl(business)}.`,
      '',
      'Lembre que o saldo da empresa não é dinheiro pessoal até você transferir.',
    ].join('\n');
    return rules(text, [reference('Finanças', 'Fluxo de caixa', '/finance')]);
  },
};

function aboutProject(project: ProjectRecord, data: Workspace): Answer {
  const tasks = data.tasks.filter((t) => t.projectId === project.id);
  const done = tasks.filter((t) => t.status === 'done').length;
  const open = tasks.filter(isOpenTask);
  const blocked = open.filter((t) => t.status === 'blocked');
  const notes = data.notes.filter((n) => n.projectIds.includes(project.id));
  const percent = tasks.length ? Math.round((done * 100) / tasks.length) : 0;
  const parts = [
    `**${project.name}** está ${PROJECT_STATUS_TEXT[project.status] ?? project.status}: ${done} de ${tasks.length} tarefas concluídas (${percent}%).`,
  ];
  if (Format.present(project.nextDelivery))
    parts.push(`Próxima entrega: ${project.nextDelivery}.`);
  parts.push(
    open.length === 0
      ? 'Nenhuma tarefa aberta.'
      : 'Tarefas abertas:\n' +
          open
            .map(
              (t) =>
                `- ${t.title}${t.dueDate == null ? '' : ` (${Format.due(t.dueDate, data.today)})`}`,
            )
            .join('\n'),
  );
  if (blocked.length)
    parts.push(
      `⚠ ${blocked.length} bloqueada${plural(blocked.length)}: ${blocked.map((t) => t.title).join(', ')}.`,
    );
  if (notes.length) {
    const s = plural(notes.length);
    parts.push(
      `${notes.length} nota${s} vinculada${s} pode${plural(notes.length, 'm')} ajudar.`,
    );
  }
  return rules(parts.join('\n\n'), [
    reference('Projeto', project.name, `/projects/view?id=${project.id}`),
    ...open.slice(0, 4).map((t) => taskRef(t.title)),
    ...notes.map(noteRef),
  ]);
}

function overdue(openTasks: TaskRecord[], data: Workspace): Answer {
  const late = openTasks.filter(
    (t) => t.dueDate != null && t.dueDate < data.today,
  );
  const s = plural(late.length);
  const text =
    late.length === 0
      ? 'Nada atrasado. 🎉'
      : `Você tem ${late.length} tarefa${s} atrasada${s}:\n${late
          .map(
            (t) =>
              `- **${t.title}**, ${Format.due(t.dueDate!, data.today)}${t.status === 'blocked' ? ' (bloqueada)' : ''}`,
          )
          .join(
            '\n',
          )}\n\nComece pelas bloqueadas: elas geralmente precisam de uma mensagem, não de trabalho.`;
  return rules(
    text,
    late.map((t) => taskRef(t.title)),
  );
}

function focus(openTasks: TaskRecord[], data: Workspace): Answer {
  const list = openTasks
    .filter(
      (t) =>
        t.dueDate != null && Format.daysBetween(data.today, t.dueDate) <= 2,
    )
    .sort(
      (a, b) =>
        (PRIORITY_RANK[a.priority] ?? 2) - (PRIORITY_RANK[b.priority] ?? 2) ||
        a.dueDate!.localeCompare(b.dueDate!),
    );
  const text =
    list.length === 0
      ? 'Nada vence nos próximos dois dias. Bom momento para o backlog ou para estudar.'
      : `Para hoje, nesta ordem:\n${list
          .map(
            (t, i) =>
              `${i + 1}. **${t.title}** · prioridade ${PRIORITY_TEXT[t.priority] ?? t.priority} · ${Format.due(t.dueDate!, data.today)}`,
          )
          .join('\n')}\n\nOrdenado por prioridade e depois por prazo.`;
  return rules(
    text,
    list.map((t) => taskRef(t.title)),
  );
}

function purchases(all: PurchaseRecord[]): Answer {
  const open = all.filter((p) => p.status !== 'bought');
  const text =
    open.length === 0
      ? 'Nenhuma compra planejada.'
      : open
          .map((p) => {
            if (p.ready)
              return `- **${p.name}**: valor todo reservado, pronto para comprar.`;
            if (p.months == null)
              return `- **${p.name}**: ${Format.brl(p.missing)} faltando, sem economia mensal definida.`;
            return `- **${p.name}**: ${Format.brl(p.missing)} faltando, dá para comprar em ${p.months} meses${p.onTime === false ? ' (depois do que você queria)' : ''}.`;
          })
          .join('\n');
  return rules(text, [
    reference('Finanças', 'Compras planejadas', '/finance/purchases'),
  ]);
}

function goals(all: GoalRecord[]): Answer {
  const active = all.filter((g) => g.status === 'active');
  const text =
    active.length === 0
      ? 'Nenhuma meta ativa.'
      : 'Metas ativas:\n' +
        active
          .map(
            (g) => `- **${g.name}**: ${g.percent}% (${g.basis.toLowerCase()})`,
          )
          .join('\n');
  return rules(
    text,
    active.map((g) => reference('Meta', g.name, `/goals/view?id=${g.id}`)),
  );
}

function contacts(all: ContactRecord[], data: Workspace): Answer {
  const due = all
    .filter(
      (c) =>
        c.nextContact != null &&
        Format.daysBetween(data.today, c.nextContact) <= 7,
    )
    .sort((a, b) => a.nextContact!.localeCompare(b.nextContact!));
  const text =
    due.length === 0
      ? 'Nenhum follow-up nesta semana.'
      : 'Follow-ups desta semana:\n' +
        due
          .map(
            (c) =>
              `- **${c.name}** (${Format.present(c.role) ? c.role : 'contato'}), ${Format.due(c.nextContact!, data.today)}`,
          )
          .join('\n');
  return rules(
    text,
    due.map((c) => reference('Contato', c.name, `/contacts?contact=${c.id}`)),
  );
}

function learning(studies: StudyRecord[]): Answer {
  const ongoing = studies.filter((s) => s.status !== 'completed');
  const text =
    ongoing.length === 0
      ? 'Nenhum estudo em andamento.'
      : 'Estudos em andamento:\n' +
        ongoing
          .map(
            (s) =>
              `- **${s.name}**: ${Format.present(s.nextActivity) ? s.nextActivity : 'sem próxima atividade definida'}`,
          )
          .join('\n');
  return rules(text, [reference('Aprendizado', 'Aprendizado', '/learning')]);
}

/** Fallback: search knowledge and tasks for the question's words. */
function search(question: string, data: Workspace): Answer {
  const words = question.split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 3);
  const matches = (text: string) => {
    const lower = text.toLowerCase();
    return words.some((w) => lower.includes(w));
  };
  const references: Reference[] = [
    ...data.notes
      .filter((n) => matches(`${n.title} ${n.body} ${n.tags.join(' ')}`))
      .map(noteRef),
    ...data.snippets
      .filter((s) =>
        matches(`${s.title} ${s.explanation ?? ''} ${s.tags.join(' ')}`),
      )
      .map((s) => reference('Snippet', s.title, '/knowledge/snippets')),
    ...data.tasks
      .filter((t) => matches(`${t.title} ${t.description ?? ''}`))
      .slice(0, 5)
      .map((t) => taskRef(t.title)),
  ];
  const text =
    references.length === 0
      ? 'Ainda não encontrei nada sobre isso. Pergunte sobre o foco de hoje, tarefas atrasadas, um projeto pelo nome, metas, dinheiro, compras, contatos ou estudos.'
      : `Encontrei ${references.length} ${references.length > 1 ? 'itens relacionados' : 'item relacionado'} nos seus dados. Abra abaixo.`;
  return rules(text, references);
}
