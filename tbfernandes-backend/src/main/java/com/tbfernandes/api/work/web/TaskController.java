package com.tbfernandes.api.work.web;

import java.net.URI;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.work.application.task.TaskService;
import com.tbfernandes.api.work.domain.task.Task;
import com.tbfernandes.api.work.domain.task.TaskRepository.TaskFilter;
import com.tbfernandes.api.work.domain.task.TaskStatus;
import com.tbfernandes.api.work.protocols.StatusRequest;
import com.tbfernandes.api.work.protocols.TaskRequest;
import com.tbfernandes.api.work.protocols.TaskResponse;
import jakarta.validation.Valid;
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

}
