package com.tbfernandes.api.assistant.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import com.tbfernandes.api.assistant.domain.Answer.Reference;
import com.tbfernandes.api.contacts.ContactsLookup.ContactView;
import com.tbfernandes.api.finance.FinanceLookup.MonthView;
import com.tbfernandes.api.finance.FinanceLookup.PurchaseView;
import com.tbfernandes.api.goals.GoalsLookup.GoalView;
import com.tbfernandes.api.knowledge.KnowledgeLookup.NoteView;
import com.tbfernandes.api.knowledge.KnowledgeLookup.SnippetView;
import com.tbfernandes.api.learning.LearningLookup.StudyView;
import com.tbfernandes.api.work.WorkLookup.ProjectView;
import com.tbfernandes.api.work.WorkLookup.TaskView;

/**
 * Rule-based assistant (AST-01): the same intents, wording and references as
 * web/src/features/assistant/lib/answer.ts, so the screen behaves the same with the API.
 * Read-only by construction: it only receives a {@link Workspace} snapshot (RN-20).
 */
public final class RuleBasedAssistant {

	/** Keyword sets in English and Portuguese, since questions come in either. */
	private static final Map<String, List<String>> INTENTS = Map.of(
			"focus", List.of("today", "focus", "priorit", "next", "hoje", "foco", "fazer agora", "prioridade"),
			"overdue", List.of("overdue", "late", "atrasad", "vencid"),
			"goals", List.of("goal", "meta", "objetivo"),
			"money", List.of("money", "finance", "cash", "spend", "expense", "income", "budget", "dinheiro", "finan",
					"gast", "saldo", "receita", "despesa"),
			"purchases", List.of("buy", "purchase", "afford", "comprar", "compra"),
			"contacts", List.of("contact", "follow", "network", "contato", "pessoa", "retorno"),
			"learning", List.of("study", "learn", "certif", "estud", "aprend", "curso"));

	private static final Map<String, Integer> PRIORITY_RANK = Map.of("urgent", 0, "high", 1, "normal", 2, "low", 3);

	private static final Map<String, String> PRIORITY_TEXT = Map.of("urgent", "urgente", "high", "alta", "normal",
			"normal", "low", "baixa");

	private static final Map<String, String> PROJECT_STATUS_TEXT = Map.of("planned", "planejado", "active", "ativo",
			"paused", "pausado", "completed", "concluído");

	private RuleBasedAssistant() {
	}

	public static Answer answer(String rawQuestion, Workspace data) {
		String question = rawQuestion.toLowerCase(Locale.ROOT);
		List<TaskView> openTasks = data.tasks().stream().filter(TaskView::open).toList();

		Optional<ProjectView> project = data.projects()
			.stream()
			.filter(p -> question.contains(p.name().toLowerCase(Locale.ROOT)))
			.findFirst();
		if (project.isPresent()) {
			return aboutProject(project.get(), data);
		}
		if (has(question, "overdue")) {
			return overdue(openTasks, data);
		}
		if (has(question, "focus")) {
			return focus(openTasks, data);
		}
		if (has(question, "purchases")) {
			return purchases(data.purchases());
		}
		if (has(question, "money")) {
			return money(data.month(), "Neste mês:");
		}
		if (has(question, "goals")) {
			return goals(data.goals());
		}
		if (has(question, "contacts")) {
			return contacts(data.contacts(), data);
		}
		if (has(question, "learning")) {
			return learning(data.studies());
		}
		return search(question, data);
	}

	/**
	 * Whether one of the fixed intents or a project name matches, so {@link #answer} would not fall
	 * back to the keyword search. Open questions go to retrieval over notes and snippets (AST-04).
	 */
	public static boolean understands(String rawQuestion, Workspace data) {
		String question = rawQuestion.toLowerCase(Locale.ROOT);
		return data.projects().stream().anyMatch(p -> question.contains(p.name().toLowerCase(Locale.ROOT)))
				|| INTENTS.keySet().stream().anyMatch(intent -> has(question, intent));
	}

	private static boolean has(String question, String intent) {
		return INTENTS.get(intent).stream().anyMatch(question::contains);
	}

	private static Answer aboutProject(ProjectView project, Workspace data) {
		List<TaskView> tasks = data.tasks().stream().filter(t -> project.id().equals(t.projectId())).toList();
		long done = tasks.stream().filter(t -> "done".equals(t.status())).count();
		List<TaskView> open = tasks.stream().filter(TaskView::open).toList();
		List<TaskView> blocked = open.stream().filter(t -> "blocked".equals(t.status())).toList();
		List<NoteView> notes = data.notes().stream().filter(n -> n.projectIds().contains(project.id())).toList();

		List<String> parts = new ArrayList<>();
		long percent = tasks.isEmpty() ? 0 : Math.round(done * 100.0 / tasks.size());
		parts.add("**%s** está %s: %d de %d tarefas concluídas (%d%%).".formatted(project.name(),
				PROJECT_STATUS_TEXT.getOrDefault(project.status(), project.status()), done,
				tasks.size(), percent));
		if (present(project.nextDelivery())) {
			parts.add("Próxima entrega: " + project.nextDelivery() + ".");
		}
		parts.add(open.isEmpty() ? "Nenhuma tarefa aberta."
				: "Tarefas abertas:\n" + open.stream()
					.map(t -> "- " + t.title()
							+ (t.dueDate() == null ? "" : " (" + Due.label(t.dueDate(), data.today()) + ")"))
					.collect(Collectors.joining("\n")));
		if (!blocked.isEmpty()) {
			parts.add("⚠ %d bloqueada%s: %s.".formatted(blocked.size(), blocked.size() > 1 ? "s" : "",
					blocked.stream().map(TaskView::title).collect(Collectors.joining(", "))));
		}
		if (!notes.isEmpty()) {
			String plural = notes.size() > 1 ? "s" : "";
			parts.add("%d nota%s vinculada%s pode%s ajudar.".formatted(notes.size(), plural, plural,
					notes.size() > 1 ? "m" : ""));
		}

		List<Reference> references = new ArrayList<>();
		references.add(new Reference("Projeto", project.name(), "/projects/view?id=" + project.id()));
		open.stream().limit(4).map(t -> taskRef(t.title())).forEach(references::add);
		notes.stream().map(RuleBasedAssistant::noteRef).forEach(references::add);
		return rules(String.join("\n\n", parts), references);
	}

	private static Answer overdue(List<TaskView> openTasks, Workspace data) {
		List<TaskView> overdue = openTasks.stream()
			.filter(t -> t.dueDate() != null && t.dueDate().isBefore(data.today()))
			.toList();
		String text = overdue.isEmpty() ? "Nada atrasado. 🎉"
				: "Você tem %d tarefa%s atrasada%s:\n%s\n\nComece pelas bloqueadas: elas geralmente precisam de uma mensagem, não de trabalho."
					.formatted(overdue.size(), overdue.size() > 1 ? "s" : "", overdue.size() > 1 ? "s" : "", overdue.stream()
						.map(t -> "- **" + t.title() + "**, " + Due.label(t.dueDate(), data.today())
								+ ("blocked".equals(t.status()) ? " (bloqueada)" : ""))
						.collect(Collectors.joining("\n")));
		return rules(text, overdue.stream().map(t -> taskRef(t.title())).toList());
	}

	private static Answer focus(List<TaskView> openTasks, Workspace data) {
		List<TaskView> focus = openTasks.stream()
			.filter(t -> t.dueDate() != null && Due.daysBetween(data.today(), t.dueDate()) <= 2)
			.sorted(Comparator.<TaskView>comparingInt(t -> PRIORITY_RANK.getOrDefault(t.priority(), 2))
				.thenComparing(TaskView::dueDate))
			.toList();
		String text = focus.isEmpty() ? "Nada vence nos próximos dois dias. Bom momento para o backlog ou para estudar."
				: "Para hoje, nesta ordem:\n%s\n\nOrdenado por prioridade e depois por prazo.".formatted(IntStream
					.range(0, focus.size())
					.mapToObj(i -> "%d. **%s** · prioridade %s · %s".formatted(i + 1, focus.get(i).title(),
							PRIORITY_TEXT.getOrDefault(focus.get(i).priority(), focus.get(i).priority()),
							Due.label(focus.get(i).dueDate(), data.today())))
					.collect(Collectors.joining("\n")));
		return rules(text, focus.stream().map(t -> taskRef(t.title())).toList());
	}

	private static Answer purchases(List<PurchaseView> purchases) {
		List<PurchaseView> open = purchases.stream().filter(p -> !"bought".equals(p.status())).toList();
		String text = open.isEmpty() ? "Nenhuma compra planejada." : open.stream().map(p -> {
			if (p.ready()) {
				return "- **" + p.name() + "**: valor todo reservado, pronto para comprar.";
			}
			if (p.months() == null) {
				return "- **" + p.name() + "**: " + brl(p.missing()) + " faltando, sem economia mensal definida.";
			}
			return "- **%s**: %s faltando, dá para comprar em %d meses%s.".formatted(p.name(), brl(p.missing()), p.months(),
					Boolean.FALSE.equals(p.onTime()) ? " (depois do que você queria)" : "");
		}).collect(Collectors.joining("\n"));
		return rules(text, List.of(new Reference("Finanças", "Compras planejadas", "/finance/purchases")));
	}

	static Answer money(MonthView month, String heading) {
		String text = """
				%s
				- **Pessoal**: %s de entrada, %s de saída, saldo %s.
				- **Empresa**: %s de entrada, %s de saída, saldo %s.

				Lembre que o saldo da empresa não é dinheiro pessoal até você transferir."""
			.formatted(heading, brl(month.personalIncome()), brl(month.personalExpense()),
					brl(month.personalIncome().subtract(month.personalExpense())), brl(month.businessIncome()),
					brl(month.businessExpense()), brl(month.businessIncome().subtract(month.businessExpense())));
		return rules(text, List.of(new Reference("Finanças", "Fluxo de caixa", "/finance")));
	}

	private static Answer goals(List<GoalView> goals) {
		List<GoalView> active = goals.stream().filter(g -> "active".equals(g.status())).toList();
		String text = active.isEmpty() ? "Nenhuma meta ativa."
				: "Metas ativas:\n" + active.stream()
					.map(g -> "- **%s**: %d%% (%s)".formatted(g.name(), g.percent(), g.basis().toLowerCase(Locale.of("pt", "BR"))))
					.collect(Collectors.joining("\n"));
		return rules(text, active.stream().map(g -> new Reference("Meta", g.name(), "/goals/view?id=" + g.id())).toList());
	}

	private static Answer contacts(List<ContactView> contacts, Workspace data) {
		List<ContactView> due = contacts.stream()
			.filter(c -> c.nextContact() != null && Due.daysBetween(data.today(), c.nextContact()) <= 7)
			.sorted(Comparator.comparing(ContactView::nextContact))
			.toList();
		String text = due.isEmpty() ? "Nenhum follow-up nesta semana."
				: "Follow-ups desta semana:\n" + due.stream()
					.map(c -> "- **%s** (%s), %s".formatted(c.name(), present(c.role()) ? c.role() : "contato",
							Due.label(c.nextContact(), data.today())))
					.collect(Collectors.joining("\n"));
		return rules(text,
				due.stream().map(c -> new Reference("Contato", c.name(), "/contacts?contact=" + c.id())).toList());
	}

	private static Answer learning(List<StudyView> studies) {
		List<StudyView> ongoing = studies.stream().filter(s -> !"completed".equals(s.status())).toList();
		String text = ongoing.isEmpty() ? "Nenhum estudo em andamento."
				: "Estudos em andamento:\n" + ongoing.stream()
					.map(s -> "- **" + s.name() + "**: "
							+ (present(s.nextActivity()) ? s.nextActivity() : "sem próxima atividade definida"))
					.collect(Collectors.joining("\n"));
		return rules(text, List.of(new Reference("Aprendizado", "Aprendizado", "/learning")));
	}

	/** Fallback: search knowledge and tasks for the question's words. */
	private static Answer search(String question, Workspace data) {
		List<String> words = Arrays.stream(question.split("[^\\p{L}\\p{N}]+")).filter(w -> w.length() > 3).toList();
		java.util.function.Predicate<String> matches = text -> {
			String lower = text.toLowerCase(Locale.ROOT);
			return words.stream().anyMatch(lower::contains);
		};
		List<Reference> references = new ArrayList<>();
		data.notes()
			.stream()
			.filter(n -> matches.test(n.title() + " " + n.body() + " " + String.join(" ", n.tags())))
			.map(RuleBasedAssistant::noteRef)
			.forEach(references::add);
		data.snippets()
			.stream()
			.filter(s -> matches.test(s.title() + " " + orEmpty(s.explanation()) + " " + String.join(" ", s.tags())))
			.map(s -> new Reference("Snippet", s.title(), "/knowledge/snippets"))
			.forEach(references::add);
		data.tasks()
			.stream()
			.filter(t -> matches.test(t.title() + " " + orEmpty(t.description())))
			.limit(5)
			.map(t -> taskRef(t.title()))
			.forEach(references::add);
		String text = references.isEmpty()
				? "Ainda não encontrei nada sobre isso. Pergunte sobre o foco de hoje, tarefas atrasadas, um projeto pelo nome, metas, dinheiro, compras, contatos ou estudos."
				: "Encontrei %d %s nos seus dados. Abra abaixo.".formatted(references.size(),
						references.size() > 1 ? "itens relacionados" : "item relacionado");
		return rules(text, references);
	}

	private static Answer rules(String text, List<Reference> references) {
		return new Answer(text, references, "rules");
	}

	static Reference taskRef(String title) {
		return new Reference("Tarefa", title, "/tasks?q=" + encodeUriComponent(title));
	}

	/** Same output as JavaScript's encodeURIComponent, so links match the frontend's. */
	static String encodeUriComponent(String value) {
		return URLEncoder.encode(value, StandardCharsets.UTF_8)
			.replace("+", "%20")
			.replace("%21", "!")
			.replace("%27", "'")
			.replace("%28", "(")
			.replace("%29", ")")
			.replace("%7E", "~");
	}

	static Reference noteRef(NoteView note) {
		return new Reference("Nota", note.title(), "/knowledge?note=" + note.id());
	}

	/** Whole reais, like formatBRL in web/src/lib/money.ts ("R$ 1.234"). */
	static String brl(BigDecimal value) {
		NumberFormat format = NumberFormat.getCurrencyInstance(Locale.of("pt", "BR"));
		format.setMaximumFractionDigits(0);
		format.setRoundingMode(RoundingMode.HALF_UP);
		return format.format(value);
	}

	private static boolean present(String value) {
		return value != null && !value.isBlank();
	}

	private static String orEmpty(String value) {
		return value == null ? "" : value;
	}

}
