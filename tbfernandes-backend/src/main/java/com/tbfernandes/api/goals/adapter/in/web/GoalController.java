package com.tbfernandes.api.goals.adapter.in.web;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.goals.application.GoalLinksService;
import com.tbfernandes.api.goals.application.GoalLinksService.GoalLinks;
import com.tbfernandes.api.goals.application.GoalService;
import com.tbfernandes.api.goals.domain.Goal;
import com.tbfernandes.api.goals.domain.GoalDetails;
import com.tbfernandes.api.goals.domain.Milestone;
import com.tbfernandes.api.shared.infrastructure.web.Resource;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
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

/** Goals and milestones. Bodies match web/src/features/goals/types/goal.ts. */
@RestController
@RequestMapping("/api/v1")
class GoalController {

	private final GoalService service;
	private final GoalLinksService links;

	GoalController(GoalService service, GoalLinksService links) {
		this.service = service;
		this.links = links;
	}

	@GetMapping("/goals")
	List<Resource<GoalDetails>> list() {
		return service.list().stream().map(Resource::of).toList();
	}

	@GetMapping("/goals/{id}")
	Resource<GoalDetails> get(@PathVariable UUID id) {
		return Resource.of(service.get(id));
	}

	@GetMapping("/goals/{id}/links")
	GoalLinks links(@PathVariable UUID id) {
		return links.linksOf(id);
	}

	@PostMapping("/goals")
	ResponseEntity<Resource<GoalDetails>> create(@RequestBody GoalDetails body) {
		Goal goal = service.create(body);
		return ResponseEntity.created(URI.create("/api/v1/goals/" + goal.id())).body(Resource.of(goal));
	}

	@PutMapping("/goals/{id}")
	Resource<GoalDetails> update(@PathVariable UUID id, @RequestBody GoalDetails body) {
		return Resource.of(service.update(id, body));
	}

	/** RF-GOL-04: only the current value of the indicator. */
	@PatchMapping("/goals/{id}/indicator")
	Resource<GoalDetails> recordProgress(@PathVariable UUID id, @Valid @RequestBody ProgressRequest body) {
		return Resource.of(service.recordProgress(id, body.current()));
	}

	@DeleteMapping("/goals/{id}")
	ResponseEntity<Void> delete(@PathVariable UUID id) {
		service.delete(id);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/milestones")
	List<Resource<Milestone.Details>> milestones(@RequestParam(required = false) UUID goalId) {
		return service.milestones(goalId).stream().map(Resource::of).toList();
	}

	@PostMapping("/milestones")
	ResponseEntity<Resource<Milestone.Details>> createMilestone(@RequestBody Milestone.Details body) {
		Milestone milestone = service.createMilestone(body);
		return ResponseEntity.created(URI.create("/api/v1/milestones/" + milestone.id()))
			.body(Resource.of(milestone));
	}

	@PutMapping("/milestones/{id}")
	Resource<Milestone.Details> updateMilestone(@PathVariable UUID id, @RequestBody Milestone.Details body) {
		return Resource.of(service.updateMilestone(id, body));
	}

	@DeleteMapping("/milestones/{id}")
	ResponseEntity<Void> deleteMilestone(@PathVariable UUID id) {
		service.deleteMilestone(id);
		return ResponseEntity.noContent().build();
	}

	record ProgressRequest(@NotNull BigDecimal current) {
	}

}
