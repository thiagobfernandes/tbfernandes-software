package com.tbfernandes.api.work.adapter.in.web;

import java.net.URI;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.work.application.task.TaskService;
import com.tbfernandes.api.work.domain.task.ChecklistItem;
import com.tbfernandes.api.work.domain.task.Task;
import com.tbfernandes.api.work.domain.task.TaskDetails;
import com.tbfernandes.api.work.domain.task.TaskPriority;
import com.tbfernandes.api.work.domain.task.TaskRepository.TaskFilter;
import com.tbfernandes.api.work.domain.task.TaskStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tasks")
class TaskController {

	private final TaskService service;
	private final Clock clock;

	TaskController(TaskService service, Clock clock) {
		this.service = service;
		this.clock = clock;
	}

	/** WRK-06: overdue=true returns open tasks due before today. */
	@GetMapping
	List<TaskResponse> list(@RequestParam(required = false) UUID projectId,
			@RequestParam(required = false) TaskStatus status, @RequestParam(required = false) LocalDate dueFrom,
			@RequestParam(required = false) LocalDate dueTo, @RequestParam(defaultValue = "false") boolean overdue) {
		TaskFilter filter = new TaskFilter(projectId, status, dueFrom, dueTo, overdue ? LocalDate.now(clock) : null);
		return service.list(filter).stream().map(TaskResponse::from).toList();
	}

	@GetMapping("/{id}")
	TaskResponse get(@PathVariable UUID id) {
		return TaskResponse.from(service.get(id));
	}

	@PostMapping
	ResponseEntity<TaskResponse> create(@Valid @RequestBody TaskRequest request) {
		Task task = service.create(request.toDetails(), request.status());
		return ResponseEntity.created(URI.create("/api/v1/tasks/" + task.id())).body(TaskResponse.from(task));
	}

	@PutMapping("/{id}")
	TaskResponse update(@PathVariable UUID id, @Valid @RequestBody TaskRequest request) {
		Task task = service.update(id, request.toDetails());
		if (request.status() != null) {
			task = service.changeStatus(id, request.status());
		}
		return TaskResponse.from(task);
	}

	@PatchMapping("/{id}/status")
	TaskResponse changeStatus(@PathVariable UUID id, @Valid @RequestBody StatusRequest request) {
		return TaskResponse.from(service.changeStatus(id, request.status()));
	}

	@DeleteMapping("/{id}")
	ResponseEntity<Void> delete(@PathVariable UUID id) {
		service.delete(id);
		return ResponseEntity.noContent().build();
	}

	record StatusRequest(@NotNull TaskStatus status) {
	}

	record ChecklistItemDto(UUID id, @NotBlank @Size(max = 200) String title, boolean done) {
	}

	record Progress(@PositiveOrZero int done, @PositiveOrZero int total) {
	}

	record TaskRequest(@NotBlank @Size(max = 200) String title, @Size(max = 5000) String description,
			UUID projectId, TaskStatus status, TaskPriority priority, @Size(max = 40) String tag,
			LocalDate startDate, LocalDate dueDate, @Size(max = 1000) String doneCriteria, @Valid Progress checklist,
			List<@Valid ChecklistItemDto> checklistItems, UUID goalId) {

		TaskDetails toDetails() {
			List<ChecklistItem> items = checklistItems == null ? List.of()
					: checklistItems.stream().map(i -> new ChecklistItem(i.id(), i.title(), i.done())).toList();
			return new TaskDetails(title, description, projectId, priority, tag, startDate, dueDate, doneCriteria,
					checklist == null ? null : checklist.done(), checklist == null ? null : checklist.total(), items,
					goalId);
		}

	}

	/** Same shape as web/src/features/tasks/types/task.ts. */
	record TaskResponse(UUID id, String title, String description, UUID projectId, TaskStatus status,
			TaskPriority priority, String tag, LocalDate startDate, LocalDate dueDate, String doneCriteria,
			Progress checklist, List<ChecklistItemDto> checklistItems, UUID goalId, Instant completedAt) {

		static TaskResponse from(Task task) {
			TaskDetails d = task.details();
			Task.Progress progress = task.progress();
			return new TaskResponse(task.id(), d.title(), d.description(), d.projectId(), task.status(),
					d.priority(), d.tag(), d.startDate(), d.dueDate(), d.doneCriteria(),
					progress == null ? null : new Progress(progress.done(), progress.total()),
					d.checklistItems().stream().map(i -> new ChecklistItemDto(i.id(), i.title(), i.done())).toList(),
					d.goalId(), task.completedAt());
		}

	}

}
