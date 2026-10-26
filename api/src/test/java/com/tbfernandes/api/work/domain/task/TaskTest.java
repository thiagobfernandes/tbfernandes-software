package com.tbfernandes.api.work.domain.task;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.shared.domain.BusinessRuleViolation;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TaskTest {

	private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-10-23T12:00:00Z"), ZoneOffset.UTC);

	private static TaskDetails details() {
		return new TaskDetails("Write the ADR", null, null, null, null, null, null, null, null, null, null, null);
	}

	@Test
	void completingRecordsWhenAndReopeningClearsIt() {
		Task task = Task.create(UUID.randomUUID(), details(), TaskStatus.TODO, CLOCK);

		assertThat(task.changeStatus(TaskStatus.DONE, CLOCK)).isTrue();
		assertThat(task.completedAt()).isEqualTo(CLOCK.instant());

		assertThat(task.changeStatus(TaskStatus.IN_PROGRESS, CLOCK)).isFalse();
		assertThat(task.completedAt()).isNull();
	}

	@Test
	void blockedTaskCannotBeCompletedDirectly() {
		Task task = Task.create(UUID.randomUUID(), details(), TaskStatus.BLOCKED, CLOCK);

		assertThatThrownBy(() -> task.changeStatus(TaskStatus.DONE, CLOCK)).isInstanceOf(BusinessRuleViolation.class)
			.hasMessageContaining("Unblock");
	}

	@Test
	void dueDateCannotPrecedeStartDate() {
		TaskDetails invalid = new TaskDetails("Late", null, null, null, null, LocalDate.of(2026, 10, 10),
				LocalDate.of(2026, 10, 1), null, null, null, null, null);

		assertThatThrownBy(() -> Task.create(UUID.randomUUID(), invalid, null, CLOCK))
			.isInstanceOf(BusinessRuleViolation.class);
	}

	@Test
	void progressComesFromItemsWhenPresent() {
		TaskDetails withItems = new TaskDetails("Checklist", null, null, null, null, null, null, null, 0, 9,
				List.of(new ChecklistItem(null, "a", true), new ChecklistItem(null, "b", false)), null);

		Task task = Task.create(UUID.randomUUID(), withItems, null, CLOCK);

		assertThat(task.progress()).isEqualTo(new Task.Progress(1, 2));
		assertThat(task.status()).isEqualTo(TaskStatus.BACKLOG);
	}

}
