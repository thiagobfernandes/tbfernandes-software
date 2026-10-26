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
			return money(data.month());
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
		parts.add("**%s** is %s: %d of %d tasks done (%d%%).".formatted(project.name(), project.status(), done,
				tasks.size(), percent));
		if (present(project.nextDelivery())) {
			parts.add("Next delivery: " + project.nextDelivery() + ".");
		}
		parts.add(open.isEmpty() ? "No open tasks."
				: "Open tasks:\n" + open.stream()
					.map(t -> "- " + t.title()
							+ (t.dueDate() == null ? "" : " (" + Due.label(t.dueDate(), data.today()) + ")"))
					.collect(Collectors.joining("\n")));
		if (!blocked.isEmpty()) {
			parts.add("⚠ %d blocked: %s.".formatted(blocked.size(),
					blocked.stream().map(TaskView::title).collect(Collectors.joining(", "))));
		}
		if (!notes.isEmpty()) {
			parts.add("%d linked note%s may help.".formatted(notes.size(), notes.size() > 1 ? "s" : ""));
		}

		List<Reference> references = new ArrayList<>();
		references.add(new Reference("Project", project.name(), "/projects/" + project.id()));
		open.stream().limit(4).map(t -> taskRef(t.title())).forEach(references::add);
		notes.stream().map(RuleBasedAssistant::noteRef).forEach(references::add);
		return rules(String.join("\n\n", parts), references);
	}

	private static Answer overdue(List<TaskView> openTasks, Workspace data) {
		List<TaskView> overdue = openTasks.stream()
			.filter(t -> t.dueDate() != null && t.dueDate().isBefore(data.today()))
			.toList();
		String text = overdue.isEmpty() ? "Nothing is overdue. 🎉"
				: "You have %d overdue task%s:\n%s\n\nStart with blocked items: they usually need a message, not work."
					.formatted(overdue.size(), overdue.size() > 1 ? "s" : "", overdue.stream()
						.map(t -> "- **" + t.title() + "**, " + Due.label(t.dueDate(), data.today())
								+ ("blocked".equals(t.status()) ? " (blocked)" : ""))
						.collect(Collectors.joining("\n")));
		return rules(text, overdue.stream().map(t -> taskRef(t.title())).toList());
	}

	private static Answer focus(List<TaskView> openTasks, Workspace data) {
		List<TaskView> focus = openTasks.stream()
			.filter(t -> t.dueDate() != null && Due.daysBetween(data.today(), t.dueDate()) <= 2)
			.sorted(Comparator.<TaskView>comparingInt(t -> PRIORITY_RANK.getOrDefault(t.priority(), 2))
				.thenComparing(TaskView::dueDate))
			.toList();
		String text = focus.isEmpty() ? "Nothing is due in the next two days. Good moment for backlog or study."
				: "For today, in this order:\n%s\n\nOrdered by priority, then due date.".formatted(IntStream
					.range(0, focus.size())
					.mapToObj(i -> "%d. **%s** · %s · %s".formatted(i + 1, focus.get(i).title(), focus.get(i).priority(),
							Due.label(focus.get(i).dueDate(), data.today())))
					.collect(Collectors.joining("\n")));
		return rules(text, focus.stream().map(t -> taskRef(t.title())).toList());
	}

	private static Answer purchases(List<PurchaseView> purchases) {
		List<PurchaseView> open = purchases.stream().filter(p -> !"bought".equals(p.status())).toList();
		String text = open.isEmpty() ? "No planned purchases." : open.stream().map(p -> {
			if (p.ready()) {
				return "- **" + p.name() + "**: fully reserved, ready to buy.";
			}
			if (p.months() == null) {
				return "- **" + p.name() + "**: " + brl(p.missing()) + " missing, no monthly saving set.";
			}
			return "- **%s**: %s missing, affordable in %d months%s.".formatted(p.name(), brl(p.missing()), p.months(),
					Boolean.FALSE.equals(p.onTime()) ? " (later than you wanted)" : "");
		}).collect(Collectors.joining("\n"));
		return rules(text, List.of(new Reference("Finance", "Planned purchases", "/finance/purchases")));
	}

	private static Answer money(MonthView month) {
		String text = """
				This month:
				- **Personal**: %s in, %s out, balance %s.
				- **Business**: %s in, %s out, balance %s.

				Remember that business balance is not personal money until you transfer it."""
			.formatted(brl(month.personalIncome()), brl(month.personalExpense()),
					brl(month.personalIncome().subtract(month.personalExpense())), brl(month.businessIncome()),
					brl(month.businessExpense()), brl(month.businessIncome().subtract(month.businessExpense())));
		return rules(text, List.of(new Reference("Finance", "Cash flow", "/finance")));
	}

	private static Answer goals(List<GoalView> goals) {
		List<GoalView> active = goals.stream().filter(g -> "active".equals(g.status())).toList();
		String text = active.isEmpty() ? "No active goals."
				: "Active goals:\n" + active.stream()
					.map(g -> "- **%s**: %d%% (%s)".formatted(g.name(), g.percent(), g.basis().toLowerCase(Locale.ROOT)))
					.collect(Collectors.joining("\n"));
		return rules(text, active.stream().map(g -> new Reference("Goal", g.name(), "/goals/" + g.id())).toList());
	}

	private static Answer contacts(List<ContactView> contacts, Workspace data) {
		List<ContactView> due = contacts.stream()
			.filter(c -> c.nextContact() != null && Due.daysBetween(data.today(), c.nextContact()) <= 7)
			.sorted(Comparator.comparing(ContactView::nextContact))
			.toList();
		String text = due.isEmpty() ? "No follow-ups due this week."
				: "Follow up this week:\n" + due.stream()
					.map(c -> "- **%s** (%s), %s".formatted(c.name(), present(c.role()) ? c.role() : "contact",
							Due.label(c.nextContact(), data.today())))
					.collect(Collectors.joining("\n"));
		return rules(text,
				due.stream().map(c -> new Reference("Contact", c.name(), "/contacts?contact=" + c.id())).toList());
	}

	private static Answer learning(List<StudyView> studies) {
		List<StudyView> ongoing = studies.stream().filter(s -> !"completed".equals(s.status())).toList();
		String text = ongoing.isEmpty() ? "No ongoing studies."
				: "Ongoing studies:\n" + ongoing.stream()
					.map(s -> "- **" + s.name() + "**: "
							+ (present(s.nextActivity()) ? s.nextActivity() : "no next activity set"))
					.collect(Collectors.joining("\n"));
		return rules(text, List.of(new Reference("Learning", "Learning", "/learning")));
	}

	/** Fallback: search knowledge and tasks for the question's words. */
	private static Answer search(String question, Workspace data) {
		List<String> words = Arrays.stream(question.split("\\W+")).filter(w -> w.length() > 3).toList();
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
				? "I could not find anything about that yet. Try asking about today's focus, overdue tasks, a project by name, goals, money, purchases, contacts or studies."
				: "I found %d related item%s in your workspace. Open them below.".formatted(references.size(),
						references.size() > 1 ? "s" : "");
		return rules(text, references);
	}

	private static Answer rules(String text, List<Reference> references) {
		return new Answer(text, references, "rules");
	}

	private static Reference taskRef(String title) {
		return new Reference("Task", title, "/tasks?q=" + encodeUriComponent(title));
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

	private static Reference noteRef(NoteView note) {
		return new Reference("Note", note.title(), "/knowledge?note=" + note.id());
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
