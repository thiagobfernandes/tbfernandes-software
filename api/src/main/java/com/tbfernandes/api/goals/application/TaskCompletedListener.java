package com.tbfernandes.api.goals.application;

import com.tbfernandes.api.goals.domain.GoalRepository;
import com.tbfernandes.api.work.TaskCompleted;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/** GOL-05: a completed task moves its goal forward (see Goal#linkedTaskCompleted). */
@Component
class TaskCompletedListener {

	private final GoalRepository goals;

	TaskCompletedListener(GoalRepository goals) {
		this.goals = goals;
	}

	@ApplicationModuleListener
	void on(TaskCompleted event) {
		if (event.goalId() == null) {
			return;
		}
		goals.findById(event.ownerId(), event.goalId()).ifPresent(goal -> {
			if (goal.linkedTaskCompleted()) {
				goals.save(goal);
			}
		});
	}

}
