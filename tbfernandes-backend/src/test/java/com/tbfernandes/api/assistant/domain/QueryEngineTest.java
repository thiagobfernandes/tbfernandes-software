package com.tbfernandes.api.assistant.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.tbfernandes.api.assistant.domain.StructuredQuery.Aggregate;
import com.tbfernandes.api.assistant.domain.StructuredQuery.Sort;
import com.tbfernandes.api.assistant.domain.StructuredQuery.Subject;
import com.tbfernandes.api.contacts.ContactsLookup.ContactView;
import com.tbfernandes.api.finance.FinanceLookup.MonthView;
import com.tbfernandes.api.knowledge.KnowledgeLookup.NoteView;
import com.tbfernandes.api.work.WorkLookup.CompanyView;
import com.tbfernandes.api.work.WorkLookup.ProjectView;
import com.tbfernandes.api.work.WorkLookup.TaskView;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class QueryEngineTest {

	private static final LocalDate TODAY = LocalDate.of(2026, 10, 30);

	private static final UUID COMPANY = UUID.randomUUID();

	private static final UUID PROJECT = UUID.randomUUID();

	private static final List<TaskView> TASKS = List.of(
			task("Corrigir relatório", "todo", "normal", PROJECT, TODAY.minusDays(2)),
			task("Publicar migração", "in_progress", "urgent", PROJECT, TODAY.plusDays(1)),
			task("Revisar contrato", "blocked", "high", null, TODAY.minusDays(5)),
			task("Tarefa antiga", "done", "low", PROJECT, TODAY.minusDays(9)));

	private static final Workspace DATA = new Workspace(TODAY, List.of(new CompanyView(COMPANY, "Zasso", "active")),
			List.of(new ProjectView(PROJECT, "Portal", "active", COMPANY, null, TODAY.plusDays(30), null)), TASKS,
			List.of(new NoteView(UUID.randomUUID(), "Decisões de migração", "Usar Flyway", List.of("banco"), Set.of(PROJECT),
					Set.of()), new NoteView(UUID.randomUUID(), "Receitas", "Pão", List.of(), Set.of(), Set.of())),
			List.of(), List.of(), List.of(), List.of(),
			new MonthView(YearMonth.of(2026, 9), BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ZERO, BigDecimal.ZERO),
			List.of(new ContactView(UUID.randomUUID(), "Ana", "CTO", COMPANY, "Zasso", TODAY.plusDays(3))));

	@Test
	void overdueOpenTasksIncludeOnlyWhatIsLateAndNotFinished() {
		Answer answer = QueryEngine.run(query(Subject.TASKS, true, null, TODAY.minusDays(1), Sort.DUE_DATE, ""), DATA);

		assertThat(answer.text()).startsWith("Encontrei 2 tarefas:")
			.contains("**Revisar contrato** · prioridade alta · atrasada 5d · bloqueada")
			.doesNotContain("Tarefa antiga", "Publicar migração");
		assertThat(answer.references()).extracting(Answer.Reference::label)
			.containsExactly("Revisar contrato", "Corrigir relatório");
		assertThat(answer.source()).isEqualTo("query");
		assertThat(answer.query()).isNotNull();
	}

	@Test
	void sortsByPriorityAndCounts() {
		StructuredQuery byPriority = query(Subject.TASKS, true, null, null, Sort.PRIORITY, "");
		assertThat(QueryEngine.run(byPriority, DATA).references().getFirst().label()).isEqualTo("Publicar migração");

		StructuredQuery count = new StructuredQuery(Subject.TASKS, Aggregate.COUNT, "", List.of(), List.of(), true, "", "",
				null, null, null, Sort.DUE_DATE, 0);
		assertThat(QueryEngine.run(count, DATA).text()).isEqualTo("Você tem 3 tarefas com esses critérios.");
	}

	@Test
	void filtersTasksByTheCompanyOfTheirProjectAndStatusIgnoringCase() {
		StructuredQuery query = new StructuredQuery(Subject.TASKS, null, "", List.of(" IN_PROGRESS "), List.of(), false, "",
				"zasso", null, null, null, null, 0);

		assertThat(QueryEngine.run(query, DATA).references()).extracting(Answer.Reference::label)
			.containsExactly("Publicar migração");
	}

	@Test
	void searchIgnoresAccentsAndNeedsEveryWord() {
		assertThat(QueryEngine.run(query(Subject.NOTES, false, null, null, Sort.NAME, "migracao flyway"), DATA).references())
			.extracting(Answer.Reference::label)
			.containsExactly("Decisões de migração");
		assertThat(QueryEngine.run(query(Subject.NOTES, false, null, null, Sort.NAME, "migracao receita"), DATA).text())
			.isEqualTo("Não encontrei notas com esses critérios.");
	}

	@Test
	void limitIsCappedAndReportedInTheText() {
		StructuredQuery query = new StructuredQuery(Subject.TASKS, null, "", List.of(), List.of(), false, "", "", null, null,
				null, null, 1);

		Answer answer = QueryEngine.run(query, DATA);

		assertThat(answer.references()).hasSize(1);
		assertThat(answer.text()).startsWith("Encontrei 4 tarefas. Mostrando 1:");
		assertThat(new StructuredQuery(Subject.TASKS, null, null, null, null, false, null, null, null, null, null, null, 999)
			.limit()).isEqualTo(StructuredQuery.MAX_LIMIT);
	}

	@Test
	void cashFlowNamesAnotherMonthAndKeepsScopesApart() {
		String text = QueryEngine.run(query(Subject.CASH_FLOW, false, null, null, null, ""), DATA).text();

		assertThat(text).startsWith("Em setembro de 2026:").contains("**Pessoal**", "**Empresa**");
	}

	@Test
	void aQueryNeedsASubject() {
		assertThatThrownBy(() -> query(null, false, null, null, null, "")).isInstanceOf(IllegalArgumentException.class);
	}

	private static StructuredQuery query(Subject subject, boolean openOnly, LocalDate dueFrom, LocalDate dueTo, Sort sort,
			String text) {
		return new StructuredQuery(subject, Aggregate.LIST, text, List.of(), List.of(), openOnly, "", "", dueFrom, dueTo, null,
				sort, 0);
	}

	private static TaskView task(String title, String status, String priority, UUID project, LocalDate due) {
		return new TaskView(UUID.randomUUID(), title, null, status, priority, project, null, due);
	}

}
