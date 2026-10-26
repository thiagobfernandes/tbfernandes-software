package com.tbfernandes.api.goals.application;

import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.learning.LearningLookup;
import com.tbfernandes.api.learning.LearningLookup.StudyView;
import com.tbfernandes.api.shared.application.OwnerContext;
import com.tbfernandes.api.work.WorkLookup;
import com.tbfernandes.api.work.WorkLookup.ProjectView;
import com.tbfernandes.api.work.WorkLookup.TaskView;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * GOL-04: what points to a goal, read through the other modules' public lookups.
 * The goals module depends on work and learning, never the other way round.
 */
@Service
@Transactional(readOnly = true)
public class GoalLinksService {

	private final GoalService goals;
	private final WorkLookup work;
	private final LearningLookup learning;
	private final OwnerContext owner;

	GoalLinksService(GoalService goals, WorkLookup work, LearningLookup learning, OwnerContext owner) {
		this.goals = goals;
		this.work = work;
		this.learning = learning;
		this.owner = owner;
	}

	public GoalLinks linksOf(UUID goalId) {
		goals.get(goalId);
		UUID ownerId = owner.currentOwnerId();
		List<ProjectView> projects = work.projects(ownerId).stream().filter(p -> goalId.equals(p.goalId())).toList();
		List<TaskView> tasks = work.tasks(ownerId).stream().filter(t -> goalId.equals(t.goalId())).toList();
		List<StudyView> studies = learning.studies(ownerId).stream().filter(s -> goalId.equals(s.goalId())).toList();
		return new GoalLinks(projects, tasks, studies);
	}

	public record GoalLinks(List<ProjectView> projects, List<TaskView> tasks, List<StudyView> studies) {
	}

}
