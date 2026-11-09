"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import { useNow } from "@/features/time-tracking/hooks/use-now";
import {
  entriesInWeek,
  entriesOnDay,
  hoursValue,
  localDay,
  runningEntry,
  shiftDay,
  totalSeconds,
} from "@/features/time-tracking/lib/time";
import { useAppData } from "@/lib/sample-data/store";

import { TimeEntryFormDialog } from "./time-entry-form-dialog";
import { TimeEntryList } from "./time-entry-list";
import { TimerCard } from "./timer-card";

const dayLabel = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function TimeTrackingPage() {
  const { timeEntries } = useAppData();
  const running = runningEntry(timeEntries);
  const now = useNow(Boolean(running));
  const today = localDay(now);
  const [selectedDay, setSelectedDay] = useState<string>();
  const day = selectedDay ?? today;
  const [logging, setLogging] = useState(false);

  const ofDay = entriesOnDay(timeEntries, day);
  const ofToday = entriesOnDay(timeEntries, today);
  const ofWeek = entriesInWeek(timeEntries, today);
  const daySeconds = totalSeconds(ofDay, now);

  return (
    <PageContainer>
      <PageHeading
        title="Apontamentos"
        description="Registre em tempo real no que você está trabalhando e veja para onde vai o seu tempo."
        actions={
          <>
            <SampleDataBadge />
            <Button variant="outline" onClick={() => setLogging(true)}>
              <Plus /> Lançar manualmente
            </Button>
          </>
        }
      />

      <TimerCard running={running} now={now} />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Hoje"
          value={hoursValue(totalSeconds(ofToday, now))}
          unit="h"
        />
        <MetricCard
          label="Esta semana"
          value={hoursValue(totalSeconds(ofWeek, now))}
          unit="h"
        />
        <MetricCard label="Apontamentos hoje" value={ofToday.length} />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col">
            <h2 className="text-base font-semibold capitalize">
              {day === today
                ? "Hoje"
                : dayLabel.format(new Date(`${day}T12:00:00`))}
            </h2>
            <span className="text-sm text-muted-foreground">
              {hoursValue(daySeconds)} h apontadas
            </span>
          </div>
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
        <TimeEntryList entries={ofDay} day={day} now={now} />
      </section>

      <TimeEntryFormDialog day={day} open={logging} onOpenChange={setLogging} />
    </PageContainer>
  );
}
