package com.tbfernandes.api.goals.application;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import com.tbfernandes.api.goals.GoalsLookup;
import com.tbfernandes.api.goals.domain.GoalProgress;
import com.tbfernandes.api.goals.domain.GoalRepository;
import com.tbfernandes.api.goals.domain.Milestone;
import com.tbfernandes.api.work.WorkLookup;
import com.tbfernandes.api.work.WorkLookup.ProjectView;
import com.tbfernandes.api.work.WorkLookup.TaskView;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Implements the goals module's public API: goals with their computed progress. */
@Service
@Transactional(readOnly = true)
class GoalsLookupService implements GoalsLookup {

	private final GoalRepository goals;
	private final WorkLookup work;

	GoalsLookupService(GoalRepository goals, WorkLookup work) {
		this.goals = goals;
		this.work = work;
	}

	@Override
	public List<GoalView> goals(UUID ownerId) {
		Map<UUID, List<Milestone>> milestones = goals.findMilestones(ownerId, null)
			.stream()
			.collect(Collectors.groupingBy(m -> m.details().goalId()));
		List<ProjectView> projects = work.projects(ownerId);
		List<TaskView> tasks = work.tasks(ownerId);
		return goals.findAll(ownerId).stream().map(goal -> {
			Set<UUID> projectIds = projects.stream()
				.filter(p -> goal.id().equals(p.goalId()))
				.map(ProjectView::id)
				.collect(Collectors.toSet());
			List<String> linked = tasks.stream()
				.filter(t -> goal.id().equals(t.goalId()) || (t.projectId() != null && projectIds.contains(t.projectId())))
				.map(TaskView::status)
				.toList();
			GoalProgress progress = GoalProgress.of(goal, milestones.getOrDefault(goal.id(), List.of()), linked);
			var d = goal.details();
			return new GoalView(goal.id(), d.name(), d.status().name().toLowerCase(), d.parentId(), progress.percent(),
					progress.basis());
		}).toList();
	}

}
