"use client";

import { LineChart, RingChart } from "@/components/shared/charts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  completedPerDay,
  hoursPerDay,
  hoursPerProject,
  moneyPerMonth,
} from "@/features/dashboard/lib/trends";
import { taskStatusLabels, type TaskStatus } from "@/features/tasks/types/task";
import type { ProjectColor } from "@/features/projects/types/project";
import { formatShort } from "@/lib/dates";
import { formatBRL, formatBRLCompact, formatMonth } from "@/lib/money";
import type { AppData } from "@/lib/sample-data/store";

const statusTone: Partial<Record<TaskStatus, string>> = {
  backlog: "stroke-secondary-foreground/25 fill-secondary-foreground/25",
  todo: "stroke-muted-foreground fill-muted-foreground",
  in_progress: "stroke-primary fill-primary",
  blocked: "stroke-destructive fill-destructive",
  done: "stroke-success fill-success",
};

const projectTone: Record<ProjectColor, string> = {
  teal: "stroke-teal-400 fill-teal-400",
  violet: "stroke-violet-400 fill-violet-400",
  amber: "stroke-amber-400 fill-amber-400",
  rose: "stroke-rose-400 fill-rose-400",
  sky: "stroke-sky-400 fill-sky-400",
};

const hours = (value: number) => `${value.toLocaleString("pt-BR")} h`;

/** How the last weeks went: hours and finished tasks, tasks by status, money, hours by project. */
export function RhythmSection({
  data,
  today,
}: {
  data: AppData;
  today: string;
}) {
  const logged = hoursPerDay(data, today);
  const finished = completedPerDay(data, today);
  const money = moneyPerMonth(data, today);
  const byProject = hoursPerProject(data, today);
  const totalHours = logged.reduce((sum, point) => sum + point.value, 0);
  const totalDone = finished.reduce((sum, point) => sum + point.value, 0);
  const statusSlices = (Object.keys(statusTone) as TaskStatus[])
    .map((status) => ({
      label: taskStatusLabels[status],
      value: data.tasks.filter((task) => task.status === status).length,
      tone: statusTone[status]!,
    }))
    .filter((slice) => slice.value > 0);
  const lastMonth = money.at(-1)!;
  const projectHours = byProject.reduce((sum, row) => sum + row.hours, 0);

  return (
    <section aria-label="Ritmo" className="grid gap-4 lg:grid-cols-3">
      <Card className="gap-3 rounded-lg lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">
            Ritmo das últimas 2 semanas
          </CardTitle>
          <CardDescription>
            {totalHours.toLocaleString("pt-BR")} h apontadas e {totalDone}{" "}
            tarefas concluídas em 14 dias.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <Legend tone="fill-primary">Horas apontadas</Legend>
            <Legend tone="fill-success">Tarefas concluídas</Legend>
          </div>
          <LineChart
            ariaLabel={`Horas apontadas e tarefas concluídas por dia nos últimos 14 dias. Horas: ${logged.map((p) => p.value).join(", ")}. Tarefas: ${finished.map((p) => p.value).join(", ")}.`}
            labels={logged.map((point) => formatShort(point.day))}
            series={[
              {
                label: "Horas",
                values: logged.map((point) => point.value),
                tone: "stroke-primary fill-primary",
                area: true,
                format: hours,
              },
              {
                label: "Tarefas",
                values: finished.map((point) => point.value),
                tone: "stroke-success fill-success",
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="gap-3 rounded-lg">
        <CardHeader>
          <CardTitle className="text-base">Tarefas por status</CardTitle>
          <CardDescription>
            Todas as tarefas cadastradas, menos as canceladas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RingChart
            ariaLabel={`Tarefas por status: ${statusSlices.map((s) => `${s.label} ${s.value}`).join(", ")}`}
            slices={statusSlices}
            center={String(
              statusSlices.reduce((sum, slice) => sum + slice.value, 0),
            )}
            caption="tarefas"
          />
        </CardContent>
      </Card>

      <Card className="gap-3 rounded-lg lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Resultado por mês</CardTitle>
          <CardDescription>
            Entradas menos saídas, pessoal e empresa juntos. Este mês:{" "}
            <span
              className={
                lastMonth.net < 0 ? "text-destructive" : "text-success"
              }
            >
              {formatBRL(lastMonth.net)}
            </span>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <Legend tone="fill-success">Entradas</Legend>
            <Legend tone="fill-destructive">Saídas</Legend>
            <Legend tone="fill-primary">Resultado</Legend>
          </div>
          <LineChart
            baseline
            ariaLabel={`Entradas, saídas e resultado nos últimos 6 meses: ${money.map((m) => `${formatMonth(m.month)} ${formatBRL(m.net)}`).join(", ")}`}
            labels={money.map((point) => formatMonth(point.month))}
            series={[
              {
                label: "Entradas",
                values: money.map((point) => point.income),
                tone: "stroke-success fill-success",
                format: formatBRLCompact,
              },
              {
                label: "Saídas",
                values: money.map((point) => point.expense),
                tone: "stroke-destructive fill-destructive",
                format: formatBRLCompact,
              },
              {
                label: "Resultado",
                values: money.map((point) => point.net),
                tone: "stroke-primary fill-primary",
                area: true,
                format: formatBRLCompact,
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="gap-3 rounded-lg">
        <CardHeader>
          <CardTitle className="text-base">Horas por projeto</CardTitle>
          <CardDescription>Apontamentos dos últimos 7 dias.</CardDescription>
        </CardHeader>
        <CardContent>
          {byProject.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum apontamento nos últimos 7 dias.
            </p>
          ) : (
            <RingChart
              ariaLabel={`Horas por projeto nos últimos 7 dias: ${byProject.map((r) => `${r.project?.name ?? "Sem projeto"} ${r.hours} h`).join(", ")}`}
              slices={byProject.slice(0, 5).map((row) => ({
                label: row.project?.name ?? "Sem projeto",
                value: row.hours,
                tone: row.project
                  ? projectTone[row.project.color]
                  : "stroke-muted-foreground fill-muted-foreground",
              }))}
              center={projectHours.toLocaleString("pt-BR")}
              caption="horas"
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function Legend({
  tone,
  children,
}: {
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <svg viewBox="0 0 10 10" className="size-2.5" aria-hidden>
        <circle cx="5" cy="5" r="5" className={tone} />
      </svg>
      {children}
    </span>
  );
}
