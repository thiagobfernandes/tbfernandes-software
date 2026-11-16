import type { AppData } from "@/lib/sample-data/store";
import { addDays, toDay } from "@/lib/dates";
import { addMonths } from "@/lib/money";

export type DayPoint = { day: string; value: number };

/** The last `days` days ending today, oldest first. */
export function lastDays(today: string, days: number) {
  return Array.from({ length: days }, (_, index) =>
    addDays(today, index - (days - 1)),
  );
}

/** Hours logged per day (finished entries, by the day they started). */
export function hoursPerDay(
  data: AppData,
  today: string,
  days = 14,
): DayPoint[] {
  const totals = new Map<string, number>();
  for (const entry of data.timeEntries) {
    if (!entry.endedAt) continue;
    const day = toDay(new Date(entry.startedAt));
    const hours =
      (new Date(entry.endedAt).getTime() -
        new Date(entry.startedAt).getTime()) /
      3_600_000;
    totals.set(day, (totals.get(day) ?? 0) + Math.max(0, hours));
  }
  return lastDays(today, days).map((day) => ({
    day,
    value: Math.round((totals.get(day) ?? 0) * 10) / 10,
  }));
}

/** Tasks completed per day, from their completion date. */
export function completedPerDay(
  data: AppData,
  today: string,
  days = 14,
): DayPoint[] {
  const totals = new Map<string, number>();
  for (const task of data.tasks) {
    if (task.status !== "done" || !task.completedAt) continue;
    const day = task.completedAt.slice(0, 10);
    totals.set(day, (totals.get(day) ?? 0) + 1);
  }
  return lastDays(today, days).map((day) => ({
    day,
    value: totals.get(day) ?? 0,
  }));
}

/** Open tasks due on each of the next `days` days, today first. */
export function dueAhead(data: AppData, today: string, days = 14): number[] {
  return Array.from({ length: days }, (_, index) => {
    const day = addDays(today, index);
    return data.tasks.filter(
      (task) =>
        task.status !== "done" &&
        task.status !== "canceled" &&
        task.dueDate === day,
    ).length;
  });
}

export type MonthPoint = {
  month: string;
  income: number;
  expense: number;
  net: number;
};

/** Income, expenses and net per month for the last `months` months. */
export function moneyPerMonth(
  data: AppData,
  today: string,
  months = 6,
): MonthPoint[] {
  const current = today.slice(0, 7);
  return Array.from({ length: months }, (_, index) => {
    const month = addMonths(current, index - (months - 1));
    let income = 0;
    let expense = 0;
    for (const entry of data.financeEntries) {
      if (!entry.date.startsWith(month)) continue;
      if (entry.kind === "income") income += entry.amount;
      else expense += entry.amount;
    }
    return { month, income, expense, net: income - expense };
  });
}

/** Hours per project in the last `days` days (entries without a project grouped). */
export function hoursPerProject(data: AppData, today: string, days = 7) {
  const since = addDays(today, -(days - 1));
  const totals = new Map<string, number>();
  for (const entry of data.timeEntries) {
    if (!entry.endedAt || toDay(new Date(entry.startedAt)) < since) continue;
    const hours =
      (new Date(entry.endedAt).getTime() -
        new Date(entry.startedAt).getTime()) /
      3_600_000;
    const key = entry.projectId ?? "";
    totals.set(key, (totals.get(key) ?? 0) + Math.max(0, hours));
  }
  return [...totals.entries()]
    .map(([projectId, hours]) => ({
      project: data.projects.find((project) => project.id === projectId),
      hours: Math.round(hours * 10) / 10,
    }))
    .filter((row) => row.hours > 0)
    .sort((a, b) => b.hours - a.hours);
}
