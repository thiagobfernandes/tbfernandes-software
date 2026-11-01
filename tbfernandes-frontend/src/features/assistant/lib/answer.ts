import { goalProgress } from "@/features/goals/lib/goal-progress";
import { projectPurchase } from "@/features/finance/lib/projection";
import { daysBetween, describeDue } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import type { AppData } from "@/lib/sample-data/store";
import { isOpenTask } from "@/lib/sample-data/work";
import { currentDay } from "@/lib/today";
import { goalHref, projectHref } from "@/lib/routes";

/** excerpt: the passage of the record the answer used, when it came from retrieval (AST-04). */
export type Reference = {
  kind: string;
  label: string;
  href: string;
  excerpt?: string | null;
};
/**
 * source (API only): "rules", "query", "model", "rag" (the AI answered from passages of notes
 * and snippets, citing them as [n]) or "search" (the passages themselves, without AI).
 */
export type Answer = { text: string; references: Reference[]; source?: string };

const taskRef = (title: string): Reference => ({
  kind: "Tarefa",
  label: title,
  href: `/tasks?q=${encodeURIComponent(title)}`,
});

/** Keyword sets in English and Portuguese, since questions come in either. */
const intents = {
  focus: [
    "today",
    "focus",
    "priorit",
    "next",
    "hoje",
    "foco",
    "fazer agora",
    "prioridade",
  ],
  overdue: ["overdue", "late", "atrasad", "vencid"],
  goals: ["goal", "meta", "objetivo"],
  money: [
    "money",
    "finance",
    "cash",
    "spend",
    "expense",
    "income",
    "budget",
    "dinheiro",
    "finan",
    "gast",
    "saldo",
    "receita",
    "despesa",
  ],
  purchases: ["buy", "purchase", "afford", "comprar", "compra"],
  contacts: ["contact", "follow", "network", "contato", "pessoa", "retorno"],
  learning: ["study", "learn", "certif", "estud", "aprend", "curso"],
};

function has(question: string, words: string[]) {
  return words.some((word) => question.includes(word));
}

/**
 * Rule-based stand-in for the AI assistant: reads the same data the screens
 * use and answers with links to the records it used.
 */
const projectStatusText = {
  planned: "planejado",
  active: "ativo",
  paused: "pausado",
  completed: "concluído",
};
const priorityText = {
  low: "baixa",
  normal: "normal",
  high: "alta",
  urgent: "urgente",
};

export function answer(rawQuestion: string, data: AppData): Answer {
  const question = rawQuestion.toLowerCase();
  const openTasks = data.tasks.filter(isOpenTask);

  const project = data.projects.find((p) => mentions(question, p.name));
  if (project) {
    const tasks = data.tasks.filter((t) => t.projectId === project.id);
    const done = tasks.filter((t) => t.status === "done").length;
    const open = tasks.filter(isOpenTask);
    const blocked = open.filter((t) => t.status === "blocked");
    const notes = data.notes.filter((n) => n.projectIds.includes(project.id));
    return {
      text: [
        `**${project.name}** está ${projectStatusText[project.status]}: ${done} de ${tasks.length} tarefas concluídas (${tasks.length ? Math.round((done / tasks.length) * 100) : 0}%).`,
        project.nextDelivery && `Próxima entrega: ${project.nextDelivery}.`,
        open.length
          ? `Tarefas abertas:\n${open.map((t) => `- ${t.title}${t.dueDate ? ` (${describeDue(t.dueDate, currentDay()).label.toLowerCase()})` : ""}`).join("\n")}`
          : "Nenhuma tarefa aberta.",
        blocked.length &&
          `⚠ ${blocked.length} bloqueada${blocked.length > 1 ? "s" : ""}: ${blocked.map((t) => t.title).join(", ")}.`,
        notes.length &&
          `${notes.length} nota${notes.length > 1 ? "s" : ""} vinculada${notes.length > 1 ? "s" : ""} pode${notes.length > 1 ? "m" : ""} ajudar.`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      references: [
        {
          kind: "Projeto",
          label: project.name,
          href: projectHref(project.id),
        },
        ...open.slice(0, 4).map((t) => taskRef(t.title)),
        ...notes.map((n) => ({
          kind: "Nota",
          label: n.title,
          href: `/knowledge?note=${n.id}`,
        })),
      ],
    };
  }

  if (has(question, intents.overdue)) {
    const overdue = openTasks.filter(
      (t) => t.dueDate && t.dueDate < currentDay(),
    );
    return {
      text: overdue.length
        ? `Você tem ${overdue.length} tarefa${overdue.length > 1 ? "s" : ""} atrasada${overdue.length > 1 ? "s" : ""}:\n${overdue.map((t) => `- **${t.title}**, ${describeDue(t.dueDate!, currentDay()).label.toLowerCase()}${t.status === "blocked" ? " (bloqueada)" : ""}`).join("\n")}\n\nComece pelas bloqueadas: elas geralmente precisam de uma mensagem, não de trabalho.`
        : "Nada atrasado. 🎉",
      references: overdue.map((t) => taskRef(t.title)),
    };
  }

  if (has(question, intents.focus)) {
    const focus = openTasks
      .filter((t) => t.dueDate && daysBetween(currentDay(), t.dueDate) <= 2)
      .sort((a, b) => {
        const rank = { urgent: 0, high: 1, normal: 2, low: 3 };
        return (
          rank[a.priority] - rank[b.priority] ||
          a.dueDate!.localeCompare(b.dueDate!)
        );
      });
    return {
      text: focus.length
        ? `Para hoje, nesta ordem:\n${focus.map((t, i) => `${i + 1}. **${t.title}** · prioridade ${priorityText[t.priority]} · ${describeDue(t.dueDate!, currentDay()).label.toLowerCase()}`).join("\n")}\n\nOrdenado por prioridade e depois por prazo.`
        : "Nada vence nos próximos dois dias. Bom momento para o backlog ou para estudar.",
      references: focus.map((t) => taskRef(t.title)),
    };
  }

  if (has(question, intents.purchases)) {
    const open = data.purchases.filter((p) => p.status !== "bought");
    return {
      text: open.length
        ? open
            .map((p) => {
              const projection = projectPurchase(p);
              if (projection.ready)
                return `- **${p.name}**: valor todo reservado, pronto para comprar.`;
              if (!projection.month)
                return `- **${p.name}**: ${formatBRL(projection.missing)} faltando, sem economia mensal definida.`;
              return `- **${p.name}**: ${formatBRL(projection.missing)} faltando, dá para comprar em ${projection.months} meses${projection.onTime === false ? " (depois do que você queria)" : ""}.`;
            })
            .join("\n")
        : "Nenhuma compra planejada.",
      references: [
        {
          kind: "Finanças",
          label: "Compras planejadas",
          href: "/finance/purchases",
        },
      ],
    };
  }

  if (has(question, intents.money)) {
    const month = currentDay().slice(0, 7);
    const sum = (scope: string, kind: string) =>
      data.financeEntries
        .filter(
          (e) =>
            e.date.startsWith(month) && e.scope === scope && e.kind === kind,
        )
        .reduce((total, e) => total + e.amount, 0);
    const personal = sum("personal", "income") - sum("personal", "expense");
    const business = sum("business", "income") - sum("business", "expense");
    return {
      text: `Neste mês:\n- **Pessoal**: ${formatBRL(sum("personal", "income"))} de entrada, ${formatBRL(sum("personal", "expense"))} de saída, saldo ${formatBRL(personal)}.\n- **Empresa**: ${formatBRL(sum("business", "income"))} de entrada, ${formatBRL(sum("business", "expense"))} de saída, saldo ${formatBRL(business)}.\n\nLembre que o saldo da empresa não é dinheiro pessoal até você transferir.`,
      references: [
        { kind: "Finanças", label: "Fluxo de caixa", href: "/finance" },
      ],
    };
  }

  if (has(question, intents.goals)) {
    const active = data.goals.filter((g) => g.status === "active");
    return {
      text: active.length
        ? `Metas ativas:\n${active
            .map((g) => {
              const p = goalProgress(data, g);
              return `- **${g.name}**: ${p.percent}% (${p.basis.toLowerCase()})`;
            })
            .join("\n")}`
        : "Nenhuma meta ativa.",
      references: active.map((g) => ({
        kind: "Meta",
        label: g.name,
        href: goalHref(g.id),
      })),
    };
  }

  if (has(question, intents.contacts)) {
    const due = data.contacts
      .filter(
        (c) => c.nextContact && daysBetween(currentDay(), c.nextContact) <= 7,
      )
      .sort((a, b) => a.nextContact!.localeCompare(b.nextContact!));
    return {
      text: due.length
        ? `Follow-ups desta semana:\n${due.map((c) => `- **${c.name}** (${c.role ?? "contato"}), ${describeDue(c.nextContact!, currentDay()).label.toLowerCase()}`).join("\n")}`
        : "Nenhum follow-up nesta semana.",
      references: due.map((c) => ({
        kind: "Contato",
        label: c.name,
        href: `/contacts?contact=${c.id}`,
      })),
    };
  }

  if (has(question, intents.learning)) {
    const studies = data.studies.filter((s) => s.status !== "completed");
    return {
      text: studies.length
        ? `Estudos em andamento:\n${studies.map((s) => `- **${s.name}**: ${s.nextActivity ?? "sem próxima atividade definida"}`).join("\n")}`
        : "Nenhum estudo em andamento.",
      references: [
        { kind: "Aprendizado", label: "Aprendizado", href: "/learning" },
      ],
    };
  }

  // Fallback: search knowledge and tasks for the question's words.
  const words = question
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 3);
  const matches = (text: string) =>
    words.some((word) => text.toLowerCase().includes(word));
  const notes = data.notes.filter((n) =>
    matches(`${n.title} ${n.body} ${n.tags.join(" ")}`),
  );
  const snippets = data.snippets.filter((s) =>
    matches(`${s.title} ${s.explanation ?? ""} ${s.tags.join(" ")}`),
  );
  if (notes.length + snippets.length > 0) {
    // Like the API's retrieval without AI (AST-04): the passages that were found.
    const found: Reference[] = [
      ...notes.map((n) => ({
        kind: "Nota",
        label: n.title,
        href: `/knowledge?note=${n.id}`,
        excerpt: excerpt(n.body),
      })),
      ...snippets.map((s) => ({
        kind: "Snippet",
        label: s.title,
        href: "/knowledge/snippets",
        excerpt: excerpt(s.explanation ?? ""),
      })),
    ].slice(0, 6);
    return {
      text:
        found.length === 1
          ? "Encontrei um trecho nas suas notas e snippets que pode responder. Veja abaixo."
          : `Encontrei ${found.length} trechos nas suas notas e snippets que podem responder. Veja abaixo.`,
      references: found,
      source: "search",
    };
  }
  const tasks = data.tasks.filter((t) =>
    matches(`${t.title} ${t.description ?? ""}`),
  );
  const references: Reference[] = tasks
    .slice(0, 5)
    .map((t) => taskRef(t.title));
  return {
    text: references.length
      ? `Encontrei ${references.length} ${references.length > 1 ? "itens relacionados" : "item relacionado"} nos seus dados. Abra abaixo.`
      : "Ainda não encontrei nada sobre isso. Pergunte sobre o foco de hoje, tarefas atrasadas, um projeto pelo nome, metas, dinheiro, compras, contatos ou estudos.",
    references,
  };
}

/** The start of a passage as plain text, cut at a word and on one line (GroundedAnswer.excerpt in the API). */
function excerpt(text: string, max = 280) {
  const line = text
    .replace(/^\s{0,3}(#{1,6}|>|[-*+])\s+/gm, "")
    .replace(/\*\*|__|`/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (line.length <= max) return line;
  const space = line.lastIndexOf(" ", max);
  return `${line.slice(0, space > max / 2 ? space : max)}…`;
}

/** The question names the project as whole words, like RuleBasedAssistant.mentions in the API. */
function mentions(question: string, name: string) {
  const lower = name.toLowerCase().trim();
  if (!lower) return false;
  const escaped = lower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`,
    "u",
  ).test(question);
}
