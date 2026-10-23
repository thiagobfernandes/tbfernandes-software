import type { Goal } from "@/features/goals/types/goal";
import type { AppData } from "@/lib/sample-data/store";

/** Tasks that serve a goal: linked directly, or through one of its projects. */
export function tasksOfGoal(data: AppData, goalId: string) {
  const projectIds = new Set(
    data.projects
      .filter((project) => project.goalId === goalId)
      .map((project) => project.id),
  );
  return data.tasks.filter(
    (task) =>
      task.goalId === goalId ||
      (task.projectId && projectIds.has(task.projectId)),
  );
}

/**
 * Progress in percent. The measurable indicator wins; without one, milestones
 * decide; without milestones, the share of finished linked tasks.
 */
export function goalProgress(data: AppData, goal: Goal) {
  if (goal.status === "completed") return { percent: 100, basis: "Completed" };
  if (goal.indicator && goal.indicator.target > 0) {
    return {
      percent: Math.min(
        100,
        Math.round((goal.indicator.current / goal.indicator.target) * 100),
      ),
      basis: goal.indicator.label,
    };
  }
  const milestones = data.milestones.filter((item) => item.goalId === goal.id);
  if (milestones.length) {
    const done = milestones.filter((item) => item.done).length;
    return {
      percent: Math.round((done / milestones.length) * 100),
      basis: `${done}/${milestones.length} milestones`,
    };
  }
  const tasks = tasksOfGoal(data, goal.id).filter(
    (task) => task.status !== "canceled",
  );
  if (tasks.length) {
    const done = tasks.filter((task) => task.status === "done").length;
    return {
      percent: Math.round((done / tasks.length) * 100),
      basis: `${done}/${tasks.length} tasks`,
    };
  }
  return { percent: 0, basis: "No progress measure yet" };
}

export function formatIndicator(value: number, unit: string) {
  if (unit === "BRL") {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    });
  }
  return `${value.toLocaleString("en-US")} ${unit}`;
}
