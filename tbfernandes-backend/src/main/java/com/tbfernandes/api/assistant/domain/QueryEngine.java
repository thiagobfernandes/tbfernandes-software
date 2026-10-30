package com.tbfernandes.api.assistant.domain;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import com.tbfernandes.api.assistant.domain.Answer.Reference;
import com.tbfernandes.api.assistant.domain.StructuredQuery.Aggregate;
import com.tbfernandes.api.contacts.ContactsLookup.ContactView;
import com.tbfernandes.api.finance.FinanceLookup.PurchaseView;
import com.tbfernandes.api.goals.GoalsLookup.GoalView;
import com.tbfernandes.api.knowledge.KnowledgeLookup.NoteView;
import com.tbfernandes.api.knowledge.KnowledgeLookup.SnippetView;
import com.tbfernandes.api.learning.LearningLookup.StudyView;
import com.tbfernandes.api.work.WorkLookup.CompanyView;
import com.tbfernandes.api.work.WorkLookup.ProjectView;
import com.tbfernandes.api.work.WorkLookup.TaskView;

/**
 * Runs a {@link StructuredQuery} over a {@link Workspace} (AST-03). Pure and read-only: the
 * records and links in the answer always come from the owner's data, never from the model.
 */
public final class QueryEngine {

	private static final Locale PT_BR = Locale.of("pt", "BR");

	private static final DateTimeFormatter MONTH = DateTimeFormatter.ofPattern("MMMM 'de' yyyy", PT_BR);

	private static final Map<String, Integer> PRIORITY_RANK = Map.of("urgent", 0, "high", 1, "normal", 2, "low", 3);

	private static final Map<String, String> PRIORITY_TEXT = Map.of("urgent", "urgente", "high", "alta", "normal",
			"normal", "low", "baixa");

	private QueryEngine() {
	}

	public static Answer run(StructuredQuery query, Workspace data) {
		return switch (query.subject()) {
			case CASH_FLOW -> cashFlow(query, data);
			case TASKS -> answer(query, "tarefa", "tarefas", tasks(query, data));
			case PROJECTS -> answer(query, "projeto", "projetos", projects(query, data));
			case COMPANIES -> answer(query, "empresa", "empresas", companies(query, data));
			case NOTES -> answer(query, "nota", "notas", notes(query, data));
			case SNIPPETS -> answer(query, "snippet", "snippets", snippets(query, data));
			case GOALS -> answer(query, "meta", "metas", goals(query, data));
			case STUDIES -> answer(query, "estudo", "estudos", studies(query, data));
			case PURCHASES -> answer(query, "compra planejada", "compras planejadas", purchases(query, data));
			case CONTACTS -> answer(query, "contato", "contatos", contacts(query, data));
		};
	}

	private static Answer cashFlow(StructuredQuery query, Workspace data) {
		YearMonth month = data.month().month();
		String heading = month.equals(YearMonth.from(data.today())) ? "Neste mês:" : "Em " + MONTH.format(month) + ":";
		Answer answer = RuleBasedAssistant.money(data.month(), heading);
		return new Answer(answer.text(), answer.references(), "query", query);
	}

	private static Answer answer(StructuredQuery query, String singular, String plural, Stream<Row> matches) {
		List<Row> rows = matches.sorted(order(query)).toList();
		List<Row> shown = rows.stream().limit(query.limit()).toList();
		List<Reference> references = shown.stream().map(Row::reference).toList();
		String noun = rows.size() == 1 ? singular : plural;

		String text;
		if (rows.isEmpty()) {
			text = "Não encontrei %s com esses critérios.".formatted(plural);
		}
		else if (query.aggregate() == Aggregate.COUNT) {
			text = "Você tem %d %s com esses critérios.".formatted(rows.size(), noun);
		}
		else {
			String heading = rows.size() > shown.size()
					? "Encontrei %d %s. Mostrando %d:".formatted(rows.size(), noun, shown.size())
					: "Encontrei %d %s:".formatted(rows.size(), noun);
			text = heading + "\n" + shown.stream().map(Row::line).collect(Collectors.joining("\n"));
		}
		return new Answer(text, references, "query", query);
	}

	private static Comparator<Row> order(StructuredQuery query) {
		Comparator<Row> byDue = Comparator.comparing(Row::due, Comparator.nullsLast(Comparator.naturalOrder()));
		Comparator<Row> byLabel = Comparator.comparing(Row::label);
		return switch (query.sort()) {
			case DUE_DATE -> byDue.thenComparing(byLabel);
			case PRIORITY -> Comparator.comparingInt(Row::rank).thenComparing(byDue).thenComparing(byLabel);
			case NAME -> byLabel;
		};
	}

	private static Stream<Row> tasks(StructuredQuery query, Workspace data) {
		Map<UUID, ProjectView> projects = byId(data.projects(), ProjectView::id);
		Map<UUID, CompanyView> companies = byId(data.companies(), CompanyView::id);
		return data.tasks()
			.stream()
			.filter(t -> !query.openOnly() || t.open())
			.filter(t -> statusMatches(query, t.status()))
			.filter(t -> query.priorities().isEmpty() || query.priorities().contains(t.priority()))
			.filter(t -> dueMatches(query, t.dueDate()))
			.filter(t -> textMatches(query, t.title() + " " + orEmpty(t.description())))
			.filter(t -> {
				ProjectView project = projects.get(t.projectId());
				String companyName = project == null || companies.get(project.companyId()) == null ? ""
						: companies.get(project.companyId()).name();
				return nameMatches(query.project(), project == null ? "" : project.name())
						&& nameMatches(query.company(), companyName);
			})
			.map(t -> {
				List<String> details = new ArrayList<>();
				details.add("prioridade " + PRIORITY_TEXT.getOrDefault(t.priority(), t.priority()));
				if (t.dueDate() != null) {
					details.add(Due.label(t.dueDate(), data.today()));
				}
				if ("blocked".equals(t.status())) {
					details.add("bloqueada");
				}
				return new Row(t.title(), details, t.dueDate(), PRIORITY_RANK.getOrDefault(t.priority(), 2),
						RuleBasedAssistant.taskRef(t.title()));
			});
	}

	private static Stream<Row> projects(StructuredQuery query, Workspace data) {
		Map<UUID, CompanyView> companies = byId(data.companies(), CompanyView::id);
		return data.projects()
			.stream()
			.filter(p -> !query.openOnly() || !"completed".equals(p.status()))
			.filter(p -> statusMatches(query, p.status()))
			.filter(p -> dueMatches(query, p.dueDate()))
			.filter(p -> nameMatches(query.project(), p.name()))
			.filter(p -> nameMatches(query.company(),
					companies.containsKey(p.companyId()) ? companies.get(p.companyId()).name() : ""))
			.filter(p -> textMatches(query, p.name() + " " + orEmpty(p.nextDelivery())))
			.map(p -> new Row(p.name(), p.dueDate() == null ? List.of() : List.of(Due.label(p.dueDate(), data.today())),
					p.dueDate(), 2, new Reference("Projeto", p.name(), "/projects/" + p.id())));
	}

	private static Stream<Row> companies(StructuredQuery query, Workspace data) {
		return data.companies()
			.stream()
			.filter(c -> statusMatches(query, c.status()))
			.filter(c -> nameMatches(query.company(), c.name()))
			.filter(c -> textMatches(query, c.name()))
			.map(c -> new Row(c.name(), List.of(), null, 2, new Reference("Empresa", c.name(), "/companies/" + c.id())));
	}

	private static Stream<Row> notes(StructuredQuery query, Workspace data) {
		Set<UUID> projects = projectsNamed(query, data);
		return data.notes()
			.stream()
			.filter(n -> projects == null || n.projectIds().stream().anyMatch(projects::contains))
			.filter(n -> textMatches(query, n.title() + " " + n.body() + " " + String.join(" ", n.tags())))
			.map(n -> new Row(n.title(), List.of(), null, 2, RuleBasedAssistant.noteRef(n)));
	}

	private static Stream<Row> snippets(StructuredQuery query, Workspace data) {
		Set<UUID> projects = projectsNamed(query, data);
		return data.snippets()
			.stream()
			.filter(s -> projects == null || s.projectIds().stream().anyMatch(projects::contains))
			.filter(s -> textMatches(query, s.title() + " " + orEmpty(s.explanation()) + " " + String.join(" ", s.tags())))
			.map(s -> new Row(s.title(), List.of(), null, 2, new Reference("Snippet", s.title(), "/knowledge/snippets")));
	}

	private static Stream<Row> goals(StructuredQuery query, Workspace data) {
		return data.goals()
			.stream()
			.filter(g -> !query.openOnly() || !"completed".equals(g.status()))
			.filter(g -> statusMatches(query, g.status()))
			.filter(g -> textMatches(query, g.name()))
			.map(g -> new Row(g.name(), List.of(g.percent() + "%"), null, 2,
					new Reference("Meta", g.name(), "/goals/" + g.id())));
	}

	private static Stream<Row> studies(StructuredQuery query, Workspace data) {
		return data.studies()
			.stream()
			.filter(s -> !query.openOnly() || !"completed".equals(s.status()))
			.filter(s -> statusMatches(query, s.status()))
			.filter(s -> dueMatches(query, s.dueDate()))
			.filter(s -> textMatches(query, s.name() + " " + orEmpty(s.nextActivity())))
			.map(s -> new Row(s.name(), present(s.nextActivity()) ? List.of(s.nextActivity()) : List.of(), s.dueDate(), 2,
					new Reference("Aprendizado", s.name(), "/learning")));
	}

	private static Stream<Row> purchases(StructuredQuery query, Workspace data) {
		return data.purchases()
			.stream()
			.filter(p -> !query.openOnly() || !"bought".equals(p.status()))
			.filter(p -> statusMatches(query, p.status()))
			.filter(p -> textMatches(query, p.name()))
			.map(p -> new Row(p.name(), List.of(p.ready() ? "pronta para comprar" : RuleBasedAssistant.brl(p.missing()) + " faltando"),
					null, 2, new Reference("Finanças", p.name(), "/finance/purchases")));
	}

	private static Stream<Row> contacts(StructuredQuery query, Workspace data) {
		return data.contacts()
			.stream()
			.filter(c -> dueMatches(query, c.nextContact()))
			.filter(c -> nameMatches(query.company(), orEmpty(c.companyName())))
			.filter(c -> textMatches(query, c.name() + " " + orEmpty(c.role()) + " " + orEmpty(c.companyName())))
			.map(c -> new Row(c.name(), contactDetails(c, data.today()), c.nextContact(), 2,
					new Reference("Contato", c.name(), "/contacts?contact=" + c.id())));
	}

	private static List<String> contactDetails(ContactView contact, LocalDate today) {
		List<String> details = new ArrayList<>();
		if (present(contact.role())) {
			details.add(contact.role());
		}
		if (contact.nextContact() != null) {
			details.add(Due.label(contact.nextContact(), today));
		}
		return details;
	}

	/** Ids of the projects the query names, or null when it does not filter by project. */
	private static Set<UUID> projectsNamed(StructuredQuery query, Workspace data) {
		if (query.project().isEmpty()) {
			return null;
		}
		return data.projects()
			.stream()
			.filter(p -> nameMatches(query.project(), p.name()))
			.map(ProjectView::id)
			.collect(Collectors.toSet());
	}

	private static boolean statusMatches(StructuredQuery query, String status) {
		return query.statuses().isEmpty() || query.statuses().contains(status);
	}

	private static boolean dueMatches(StructuredQuery query, LocalDate due) {
		if (query.dueFrom() == null && query.dueTo() == null) {
			return true;
		}
		return due != null && (query.dueFrom() == null || !due.isBefore(query.dueFrom()))
				&& (query.dueTo() == null || !due.isAfter(query.dueTo()));
	}

	private static boolean nameMatches(String wanted, String name) {
		return wanted.isEmpty() || fold(name).contains(fold(wanted));
	}

	/** Every word of the query's text has to appear, ignoring case and accents. */
	private static boolean textMatches(StructuredQuery query, String haystack) {
		String folded = fold(haystack);
		return Arrays.stream(fold(query.text()).split("\\s+")).allMatch(folded::contains);
	}

	private static String fold(String value) {
		return Normalizer.normalize(value, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT);
	}

	private static <T> Map<UUID, T> byId(List<T> records, Function<T, UUID> id) {
		return records.stream().collect(Collectors.toMap(id, Function.identity()));
	}

	private static boolean present(String value) {
		return value != null && !value.isBlank();
	}

	private static String orEmpty(String value) {
		return value == null ? "" : value;
	}

	private record Row(String label, List<String> details, LocalDate due, int rank, Reference reference) {

		String line() {
			return "- **" + label + "**" + (details.isEmpty() ? "" : " · " + String.join(" · ", details));
		}

	}

}
