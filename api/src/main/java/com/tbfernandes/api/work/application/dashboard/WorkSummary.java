package com.tbfernandes.api.work.application.dashboard;

/** Numbers for the dashboard cards (RF-WRK-13). */
public record WorkSummary(long openTasks, long overdueTasks, long blockedTasks, long dueToday,
		long completedThisWeek, long activeProjects, long activeCompanies) {
}
