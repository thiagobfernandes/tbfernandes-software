package com.tbfernandes.api.assistant.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.tbfernandes.api.assistant.domain.Answer.Reference;
import com.tbfernandes.api.contacts.ContactsLookup.ContactView;
import com.tbfernandes.api.finance.FinanceLookup.MonthView;
import com.tbfernandes.api.finance.FinanceLookup.PurchaseView;
import com.tbfernandes.api.goals.GoalsLookup.GoalView;
import com.tbfernandes.api.knowledge.KnowledgeLookup.NoteView;
import com.tbfernandes.api.knowledge.KnowledgeLookup.SnippetView;
import com.tbfernandes.api.learning.LearningLookup.StudyView;
import com.tbfernandes.api.work.WorkLookup.CompanyView;
import com.tbfernandes.api.work.WorkLookup.ProjectView;
import com.tbfernandes.api.work.WorkLookup.TaskView;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RuleBasedAssistantTest {

	static final LocalDate TODAY = LocalDate.of(2026, 10, 26);

	static final UUID COMPANY = UUID.randomUUID();
	static final UUID PROJECT = UUID.randomUUID();
	static final UUID GOAL = UUID.randomUUID();
	static final UUID NOTE = UUID.randomUUID();

	static Workspace workspace() {
		return new Workspace(TODAY, List.of(new CompanyView(COMPANY, "Acme", "active")),
				List.of(new ProjectView(PROJECT, "Billing Revamp", "active", COMPANY, GOAL, null, "Invoices v2")),
				List.of(task("Fix invoice totals", "blocked", "high", TODAY.minusDays(2)),
						task("Write release notes", "todo", "normal", TODAY),
						task("Call the bank", "todo", "urgent", TODAY.plusDays(1)),
						task("Ship dashboard", "done", "normal", TODAY.minusDays(5))),
				List.of(new NoteView(NOTE, "Billing decisions", "Rounding uses HALF_UP", List.of("billing"),
						Set.of(PROJECT), Set.of())),
				List.of(new SnippetView(UUID.randomUUID(), "Rounding helper", "How we round money", List.of("java"),
						Set.of(), Set.of())),
				List.of(new GoalView(GOAL, "Senior role", "active", null, 50, "1/2 milestones"),
						new GoalView(UUID.randomUUID(), "Marathon", "planned", null, 0, "No progress measure yet")),
				List.of(new StudyView(UUID.randomUUID(), "Spring Modulith", "in_progress", null, null, "Read chapter 3")),
				List.of(new PurchaseView(UUID.randomUUID(), "Laptop", "planned", null, new BigDecimal("8000"),
						new BigDecimal("2000"), new BigDecimal("6000"), false, 3, false)),
				new MonthView(YearMonth.from(TODAY), new BigDecimal("10000"), new BigDecimal("4000.40"),
						new BigDecimal("20000"), new BigDecimal("5000")),
				List.of(new ContactView(UUID.randomUUID(), "Ana", "CTO", COMPANY, null, TODAY.plusDays(3))));
	}

	static TaskView task(String title, String status, String priority, LocalDate due) {
		return new TaskView(UUID.randomUUID(), title, null, status, priority, PROJECT, null, due);
	}

	@Test
	void projectByNameWins() {
		Answer answer = RuleBasedAssistant.answer("How is billing revamp going today?", workspace());

		assertThat(answer.source()).isEqualTo("rules");
		assertThat(answer.text()).startsWith("**Billing Revamp** is active: 1 of 4 tasks done (25%).")
			.contains("Next delivery: Invoices v2.")
			.contains("- Fix invoice totals (overdue 2d)")
			.contains("⚠ 1 blocked: Fix invoice totals.")
			.contains("1 linked note may help.");
		assertThat(answer.references()).first()
			.isEqualTo(new Reference("Project", "Billing Revamp", "/projects/" + PROJECT));
		assertThat(answer.references()).contains(new Reference("Note", "Billing decisions", "/knowledge?note=" + NOTE),
				new Reference("Task", "Fix invoice totals", "/tasks?q=Fix%20invoice%20totals"));
	}

	@Test
	void overdueAndFocusInPortuguese() {
		Answer overdue = RuleBasedAssistant.answer("O que está atrasado?", workspace());
		assertThat(overdue.text()).startsWith("You have 1 overdue task:\n- **Fix invoice totals**, overdue 2d (blocked)");

		Answer focus = RuleBasedAssistant.answer("qual o foco de hoje?", workspace());
		assertThat(focus.text()).contains("""
				1. **Call the bank** · urgent · due tomorrow
				2. **Fix invoice totals** · high · overdue 2d
				3. **Write release notes** · normal · due today""");
	}

	@Test
	void moneyKeepsScopesApart() {
		Answer answer = RuleBasedAssistant.answer("how is my money?", workspace());

		assertThat(answer.text()).contains("- **Personal**: R$ 10.000 in, R$ 4.000 out, balance R$ 6.000.")
			.contains("- **Business**: R$ 20.000 in, R$ 5.000 out, balance R$ 15.000.");
	}

	@Test
	void purchasesGoalsContactsAndStudies() {
		assertThat(RuleBasedAssistant.answer("can I buy it?", workspace()).text())
			.isEqualTo("- **Laptop**: R$ 6.000 missing, affordable in 3 months (later than you wanted).");
		Answer goals = RuleBasedAssistant.answer("minhas metas", workspace());
		assertThat(goals.text()).isEqualTo("Active goals:\n- **Senior role**: 50% (1/2 milestones)");
		assertThat(goals.references()).extracting(Reference::href).containsExactly("/goals/" + GOAL);
		assertThat(RuleBasedAssistant.answer("who should I contact?", workspace()).text())
			.isEqualTo("Follow up this week:\n- **Ana** (CTO), due in 3d");
		assertThat(RuleBasedAssistant.answer("o que estudar?", workspace()).text())
			.isEqualTo("Ongoing studies:\n- **Spring Modulith**: Read chapter 3");
	}

	@Test
	void fallbackSearchesKnowledgeAndTasks() {
		Answer answer = RuleBasedAssistant.answer("rounding", workspace());
		assertThat(answer.text()).isEqualTo("I found 2 related items in your workspace. Open them below.");
		assertThat(answer.references()).extracting(Reference::kind).containsExactly("Note", "Snippet");

		assertThat(RuleBasedAssistant.answer("xyz", workspace()).references()).isEmpty();
	}

	@Test
	void encodesLikeJavaScript() {
		assertThat(RuleBasedAssistant.encodeUriComponent("Fix (a) & b's ~ok!")).isEqualTo("Fix%20(a)%20%26%20b's%20~ok!");
	}

}
