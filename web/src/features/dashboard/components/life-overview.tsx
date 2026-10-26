"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ProgressBar } from "@/components/shared/progress-bar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { goalProgress } from "@/features/goals/lib/goal-progress";
import { DueChip } from "@/features/tasks/components/due-chip";
import { daysBetween } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import type { AppData } from "@/lib/sample-data/store";
import { currentDay } from "@/lib/today";
import { cn } from "@/lib/utils";

/** Goals, money, people and learning: the non-work areas in one row. */
export function LifeOverview({ data }: { data: AppData }) {
  const goals = data.goals
    .filter((goal) => goal.status === "active")
    .slice(0, 3);
  const month = currentDay().slice(0, 7);
  const balance = (scope: "personal" | "business") =>
    data.financeEntries
      .filter((entry) => entry.scope === scope && entry.date.startsWith(month))
      .reduce(
        (sum, entry) =>
          sum + (entry.kind === "income" ? entry.amount : -entry.amount),
        0,
      );
  const followUps = data.contacts
    .filter(
      (contact) =>
        contact.nextContact &&
        daysBetween(currentDay(), contact.nextContact) <= 7,
    )
    .sort((a, b) => a.nextContact!.localeCompare(b.nextContact!));
  const studies = data.studies.filter(
    (study) => study.status === "in_progress",
  );

  return (
    <section
      aria-label="Life at a glance"
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      <OverviewCard title="Goals" href="/goals">
        {goals.length === 0 ? (
          <Empty>No active goals.</Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {goals.map((goal) => {
              const { percent } = goalProgress(data, goal);
              return (
                <li key={goal.id} className="flex flex-col gap-1.5">
                  <Link
                    href={`/goals/${goal.id}`}
                    className="flex justify-between gap-2 text-sm hover:text-primary"
                  >
                    <span className="truncate">{goal.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {percent}%
                    </span>
                  </Link>
                  <ProgressBar
                    value={percent}
                    label={`${goal.name} progress`}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </OverviewCard>

      <OverviewCard title="Money this month" href="/finance">
        <dl className="flex flex-col gap-3">
          {(["personal", "business"] as const).map((scope) => {
            const value = balance(scope);
            return (
              <div
                key={scope}
                className="flex items-baseline justify-between gap-2"
              >
                <dt className="text-sm text-muted-foreground">
                  {scope === "personal"
                    ? "Personal balance"
                    : "Business balance"}
                </dt>
                <dd
                  className={cn(
                    "text-lg font-light tabular-nums",
                    value < 0 && "text-destructive",
                  )}
                >
                  {formatBRL(value)}
                </dd>
              </div>
            );
          })}
        </dl>
      </OverviewCard>

      <OverviewCard title="Follow-ups this week" href="/contacts">
        {followUps.length === 0 ? (
          <Empty>Nobody to follow up with.</Empty>
        ) : (
          <ul className="flex flex-col gap-2">
            {followUps.slice(0, 3).map((contact) => (
              <li
                key={contact.id}
                className="flex items-center justify-between gap-2"
              >
                <Link
                  href={`/contacts?contact=${contact.id}`}
                  className="truncate text-sm hover:text-primary"
                >
                  {contact.name}
                </Link>
                <DueChip dueDate={contact.nextContact!} today={currentDay()} />
              </li>
            ))}
          </ul>
        )}
      </OverviewCard>

      <OverviewCard title="Learning" href="/learning">
        {studies.length === 0 ? (
          <Empty>No study in progress.</Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {studies.slice(0, 2).map((study) => (
              <li key={study.id} className="flex flex-col gap-0.5">
                <span className="truncate text-sm">{study.name}</span>
                <span className="text-xs text-muted-foreground">
                  Next: {study.nextActivity ?? "not defined"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </OverviewCard>
    </section>
  );
}

function OverviewCard({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-3 rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardAction>
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={href} aria-label={`Open ${title}`}>
              <ArrowUpRight />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
