"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import {
  checkOn,
  routineSeconds,
  routinesDueOn,
  streak,
} from "@/features/routines/lib/routines";
import { useNow } from "@/features/time-tracking/hooks/use-now";
import {
  hoursValue,
  localDay,
  runningEntry,
  shiftDay,
} from "@/features/time-tracking/lib/time";
import { useAppData } from "@/lib/sample-data/store";

import { RoutineDayList } from "./routine-day-list";
import { RoutineFormDialog } from "./routine-form-dialog";
import { RoutineManageList } from "./routine-manage-list";

const dayLabel = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function RoutinesPage() {
  const { routines, routineChecks, timeEntries } = useAppData();
  const running = runningEntry(timeEntries);
  const now = useNow(Boolean(running?.routineId));
  const today = localDay(now);
  const [selectedDay, setSelectedDay] = useState<string>();
  const day = selectedDay ?? today;
  const [creating, setCreating] = useState(false);

  const due = routinesDueOn(routines, day);
  const doneCount = due.filter((routine) =>
    checkOn(routineChecks, routine.id, day),
  ).length;
  const seconds = due.reduce(
    (sum, routine) => sum + routineSeconds(routine.id, timeEntries, day, now),
    0,
  );
  const bestStreak = Math.max(
    0,
    ...routines
      .filter((routine) => routine.active)
      .map((routine) => streak(routine, routineChecks, today)),
  );

  return (
    <PageContainer>
      <PageHeading
        title="Rotinas"
        description="O que você faz todo dia: marque o que foi feito e aponte o tempo de cada rotina."
        actions={
          <>
            <SampleDataBadge />
            <Button onClick={() => setCreating(true)}>
              <Plus /> Nova rotina
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label={day === today ? "Feitas hoje" : "Feitas no dia"}
          value={`${doneCount}/${due.length}`}
        />
        <MetricCard
          label="Tempo em rotinas"
          value={hoursValue(seconds)}
          unit="h"
        />
        <MetricCard label="Maior sequência" value={bestStreak} unit="dias" />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold capitalize">
            {day === today
              ? "Hoje"
              : dayLabel.format(new Date(`${day}T12:00:00`))}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Dia anterior"
              onClick={() => setSelectedDay(shiftDay(day, -1))}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={day === today}
              onClick={() => setSelectedDay(undefined)}
            >
              Hoje
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Próximo dia"
              disabled={day >= today}
              onClick={() => setSelectedDay(shiftDay(day, 1))}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
        <RoutineDayList
          routines={due}
          day={day}
          today={today}
          now={now}
          running={running}
        />
      </section>

      <RoutineManageList today={today} />

      <RoutineFormDialog
        today={today}
        open={creating}
        onOpenChange={setCreating}
      />
    </PageContainer>
  );
}
