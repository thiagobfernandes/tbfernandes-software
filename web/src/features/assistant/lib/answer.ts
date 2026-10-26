import { goalProgress } from "@/features/goals/lib/goal-progress";
import { projectPurchase } from "@/features/finance/lib/projection";
import { daysBetween, describeDue } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import type { AppData } from "@/lib/sample-data/store";
import { isOpenTask } from "@/lib/sample-data/work";
import { currentDay } from "@/lib/today";

export type Reference = { kind: string; label: string; href: string };
export type Answer = { text: string; references: Reference[] };

const taskRef = (title: string): Reference => ({
  kind: "Task",
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
export function answer(rawQuestion: string, data: AppData): Answer {
  const question = rawQuestion.toLowerCase();
  const openTasks = data.tasks.filter(isOpenTask);

  const project = data.projects.find((p) =>
    question.includes(p.name.toLowerCase()),
  );
  if (project) {
    const tasks = data.tasks.filter((t) => t.projectId === project.id);
    const done = tasks.filter((t) => t.status === "done").length;
    const open = tasks.filter(isOpenTask);
    const blocked = open.filter((t) => t.status === "blocked");
    const notes = data.notes.filter((n) => n.projectIds.includes(project.id));
    return {
      text: [
        `**${project.name}** is ${project.status}: ${done} of ${tasks.length} tasks done (${tasks.length ? Math.round((done / tasks.length) * 100) : 0}%).`,
        project.nextDelivery && `Next delivery: ${project.nextDelivery}.`,
        open.length
          ? `Open tasks:\n${open.map((t) => `- ${t.title}${t.dueDate ? ` (${describeDue(t.dueDate, currentDay()).label.toLowerCase()})` : ""}`).join("\n")}`
          : "No open tasks.",
        blocked.length &&
          `⚠ ${blocked.length} blocked: ${blocked.map((t) => t.title).join(", ")}.`,
        notes.length &&
          `${notes.length} linked note${notes.length > 1 ? "s" : ""} may help.`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      references: [
        {
          kind: "Project",
          label: project.name,
          href: `/projects/${project.id}`,
        },
        ...open.slice(0, 4).map((t) => taskRef(t.title)),
        ...notes.map((n) => ({
          kind: "Note",
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
        ? `You have ${overdue.length} overdue task${overdue.length > 1 ? "s" : ""}:\n${overdue.map((t) => `- **${t.title}**, ${describeDue(t.dueDate!, currentDay()).label.toLowerCase()}${t.status === "blocked" ? " (blocked)" : ""}`).join("\n")}\n\nStart with blocked items: they usually need a message, not work.`
        : "Nothing is overdue. 🎉",
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
        ? `For today, in this order:\n${focus.map((t, i) => `${i + 1}. **${t.title}** · ${t.priority} · ${describeDue(t.dueDate!, currentDay()).label.toLowerCase()}`).join("\n")}\n\nOrdered by priority, then due date.`
        : "Nothing is due in the next two days. Good moment for backlog or study.",
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
                return `- **${p.name}**: fully reserved, ready to buy.`;
              if (!projection.month)
                return `- **${p.name}**: ${formatBRL(projection.missing)} missing, no monthly saving set.`;
              return `- **${p.name}**: ${formatBRL(projection.missing)} missing, affordable in ${projection.months} months${projection.onTime === false ? " (later than you wanted)" : ""}.`;
            })
            .join("\n")
        : "No planned purchases.",
      references: [
        {
          kind: "Finance",
          label: "Planned purchases",
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
      text: `This month:\n- **Personal**: ${formatBRL(sum("personal", "income"))} in, ${formatBRL(sum("personal", "expense"))} out, balance ${formatBRL(personal)}.\n- **Business**: ${formatBRL(sum("business", "income"))} in, ${formatBRL(sum("business", "expense"))} out, balance ${formatBRL(business)}.\n\nRemember that business balance is not personal money until you transfer it.`,
      references: [{ kind: "Finance", label: "Cash flow", href: "/finance" }],
    };
  }

  if (has(question, intents.goals)) {
    const active = data.goals.filter((g) => g.status === "active");
    return {
      text: active.length
        ? `Active goals:\n${active
            .map((g) => {
              const p = goalProgress(data, g);
              return `- **${g.name}**: ${p.percent}% (${p.basis.toLowerCase()})`;
            })
            .join("\n")}`
        : "No active goals.",
      references: active.map((g) => ({
        kind: "Goal",
        label: g.name,
        href: `/goals/${g.id}`,
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
        ? `Follow up this week:\n${due.map((c) => `- **${c.name}** (${c.role ?? "contact"}), ${describeDue(c.nextContact!, currentDay()).label.toLowerCase()}`).join("\n")}`
        : "No follow-ups due this week.",
      references: due.map((c) => ({
        kind: "Contact",
        label: c.name,
        href: `/contacts?contact=${c.id}`,
      })),
    };
  }

  if (has(question, intents.learning)) {
    const studies = data.studies.filter((s) => s.status !== "completed");
    return {
      text: studies.length
        ? `Ongoing studies:\n${studies.map((s) => `- **${s.name}**: ${s.nextActivity ?? "no next activity set"}`).join("\n")}`
        : "No ongoing studies.",
      references: [{ kind: "Learning", label: "Learning", href: "/learning" }],
    };
  }

  // Fallback: search knowledge and tasks for the question's words.
  const words = question.split(/\W+/).filter((word) => word.length > 3);
  const matches = (text: string) =>
    words.some((word) => text.toLowerCase().includes(word));
  const notes = data.notes.filter((n) =>
    matches(`${n.title} ${n.body} ${n.tags.join(" ")}`),
  );
  const snippets = data.snippets.filter((s) =>
    matches(`${s.title} ${s.explanation ?? ""} ${s.tags.join(" ")}`),
  );
  const tasks = data.tasks.filter((t) =>
    matches(`${t.title} ${t.description ?? ""}`),
  );
  const references: Reference[] = [
    ...notes.map((n) => ({
      kind: "Note",
      label: n.title,
      href: `/knowledge?note=${n.id}`,
    })),
    ...snippets.map((s) => ({
      kind: "Snippet",
      label: s.title,
      href: "/knowledge/snippets",
    })),
    ...tasks.slice(0, 5).map((t) => taskRef(t.title)),
  ];
  return {
    text: references.length
      ? `I found ${references.length} related item${references.length > 1 ? "s" : ""} in your workspace. Open them below.`
      : "I could not find anything about that yet. Try asking about today's focus, overdue tasks, a project by name, goals, money, purchases, contacts or studies.",
    references,
  };
}
