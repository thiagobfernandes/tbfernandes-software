"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Task } from "@/features/tasks/types/task";
import { addDays, daysBetween, parseDay, toDay } from "@/lib/dates";
import { workActions } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/**
 * Right-hand rail after the Cindr reference: month calendar with due-date
 * markers and a to-do list split into Today / Next 7 days / Later.
 */
export function AgendaPanel({
  tasks,
  today,
}: {
  tasks: Task[];
  today: string;
}) {
  const [monthOffset, setMonthOffset] = useState(0);

  const todayDate = parseDay(today);
  const month = new Date(
    Date.UTC(
      todayDate.getUTCFullYear(),
      todayDate.getUTCMonth() + monthOffset,
      1,
    ),
  );
  const monthLabel = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(month);
  // Monday-first grid that always shows 6 weeks.
  const leading = (month.getUTCDay() + 6) % 7;
  const gridStart = addDays(toDay(month), -leading);
  const cells = Array.from({ length: 42 }, (_, index) =>
    addDays(gridStart, index),
  );
  const dueDays = new Set(
    tasks.filter((task) => task.status !== "done").map((task) => task.dueDate),
  );

  const open = tasks
    .filter(
      (task) =>
        task.status !== "done" && task.status !== "canceled" && task.dueDate,
    )
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  const groups = {
    today: open.filter((task) => daysBetween(today, task.dueDate!) <= 0),
    week: open.filter((task) => {
      const diff = daysBetween(today, task.dueDate!);
      return diff > 0 && diff <= 7;
    }),
    later: open.filter((task) => daysBetween(today, task.dueDate!) > 7),
  };

  function complete(task: Task) {
    workActions.updateTask(task.id, { status: "done" });
    toast.success("Task completed", {
      action: {
        label: "Undo",
        onClick: () => workActions.updateTask(task.id, { status: task.status }),
      },
    });
  }

  return (
    <aside className="flex flex-col gap-6 rounded-2xl border bg-card p-5">
      <section aria-label="Calendar" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{monthLabel}</h2>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              className="size-7"
              aria-label="Previous month"
              onClick={() => setMonthOffset((value) => value - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="size-7"
              aria-label="Next month"
              onClick={() => setMonthOffset((value) => value + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
          {weekdays.map((day) => (
            <span key={day} className="pb-1 text-muted-foreground">
              {day}
            </span>
          ))}
          {cells.map((day) => {
            const date = parseDay(day);
            const inMonth = date.getUTCMonth() === month.getUTCMonth();
            const isToday = day === today;
            return (
              <span
                key={day}
                className={cn(
                  "relative mx-auto flex size-8 items-center justify-center rounded-full tabular-nums",
                  !inMonth && "text-muted-foreground/50",
                  isToday && "bg-primary font-semibold text-primary-foreground",
                )}
              >
                {date.getUTCDate()}
                {dueDays.has(day) && !isToday && (
                  <span
                    aria-hidden
                    className="absolute bottom-0.5 size-1 rounded-full bg-primary"
                  />
                )}
              </span>
            );
          })}
        </div>
        <Link
          href="/calendar"
          className="self-end text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Open full calendar
        </Link>
      </section>

      <section aria-label="To-do" className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">
          To-do{" "}
          <span className="font-normal text-muted-foreground">
            ({open.length})
          </span>
        </h2>
        <Tabs defaultValue="today" className="gap-3">
          <TabsList className="w-full">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">Next 7 days</TabsTrigger>
            <TabsTrigger value="later">Later</TabsTrigger>
          </TabsList>
          {(Object.keys(groups) as (keyof typeof groups)[]).map((key) => (
            <TabsContent key={key} value={key}>
              {groups[key].length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Nothing here.
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {groups[key].map((task) => (
                    <li key={task.id}>
                      <label className="flex cursor-pointer items-start gap-2.5 rounded-md px-1 py-1.5 text-sm hover:bg-accent/50">
                        <Checkbox
                          checked={false}
                          aria-label={`Mark "${task.title}" as done`}
                          onCheckedChange={() => complete(task)}
                          className="mt-0.5"
                        />
                        <span className="leading-snug">{task.title}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </aside>
  );
}
