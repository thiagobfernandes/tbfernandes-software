package com.tbfernandes.api.goals.domain;

import java.util.List;

/**
 * Progress of a goal in percent (RF-GOL-05). The measurable indicator wins; without one,
 * milestones decide; without milestones, the share of finished linked tasks. Same rule as
 * web/src/features/goals/lib/goal-progress.ts.
 */
public record GoalProgress(int percent, String basis) {

	/** Status of each task that serves the goal, directly or through one of its projects. */
	public static GoalProgress of(Goal goal, List<Milestone> milestones, List<String> linkedTaskStatuses) {
		GoalDetails d = goal.details();
		if (d.status() == GoalStatus.COMPLETED) {
			return new GoalProgress(100, "Concluída");
		}
		if (d.indicator() != null) {
			return new GoalProgress(d.indicator().roundedPercent(), d.indicator().label());
		}
		if (!milestones.isEmpty()) {
			long done = milestones.stream().filter(m -> m.details().done()).count();
			return new GoalProgress(percent(done, milestones.size()), done + "/" + milestones.size() + " marcos");
		}
		List<String> counted = linkedTaskStatuses.stream().filter(s -> !"canceled".equals(s)).toList();
		if (!counted.isEmpty()) {
			long done = counted.stream().filter("done"::equals).count();
			return new GoalProgress(percent(done, counted.size()), done + "/" + counted.size() + " tarefas");
		}
		return new GoalProgress(0, "Ainda sem medida de progresso");
	}

	private static int percent(long part, int whole) {
		return (int) Math.round(part * 100.0 / whole);
	}

}
