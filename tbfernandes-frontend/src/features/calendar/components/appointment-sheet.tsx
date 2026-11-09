"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  appointmentMinutes,
  formatDuration,
  minutesToTime,
  timeToMinutes,
} from "@/features/calendar/lib/time";
import {
  appointmentSchema,
  durationToMinutes,
  type AppointmentFormValues,
} from "@/features/calendar/schemas/appointment-schema";
import type { Appointment } from "@/features/calendar/types/appointment";
import { isOpenTask } from "@/lib/sample-data/work";
import { dataActions, useAppData } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

const NONE = "none";
const LAST_TASK_KEY = "tbf-agenda-last-task";

export type AppointmentDraft = {
  date: string;
  startTime: string;
  endTime: string;
};

type AppointmentSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft?: AppointmentDraft;
  appointment?: Appointment;
};

function readLastTask() {
  try {
    return localStorage.getItem(LAST_TASK_KEY) ?? NONE;
  } catch {
    return NONE;
  }
}

function rememberTask(taskId: string) {
  try {
    localStorage.setItem(LAST_TASK_KEY, taskId);
  } catch {
    return;
  }
}

function toTime(value: string) {
  return value.length === 5 ? `${value}:00` : value;
}

export function AppointmentSheet({
  open,
  onOpenChange,
  draft,
  appointment,
}: AppointmentSheetProps) {
  const data = useAppData();
  const editing = Boolean(appointment);
  const tasks = data.tasks.filter(
    (task) => isOpenTask(task) || task.id === appointment?.taskId,
  );

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    const lastTask = readLastTask();
    const source = appointment ?? draft;
    const minutes = source ? appointmentMinutes(source) : 60;
    const defaultTask = dataActions.get("tasks", lastTask) ? lastTask : NONE;
    form.reset({
      taskId: appointment ? (appointment.taskId ?? NONE) : defaultTask,
      title: appointment?.title ?? "",
      date: source?.date ?? "",
      mode: "range",
      startTime: source?.startTime ?? "09:00:00",
      endTime: source?.endTime ?? "10:00:00",
      duration: formatDuration(minutes).slice(0, -3),
      note: appointment?.note ?? "",
    });
  }, [open, appointment, draft, form]);

  const [mode, startTime, endTime, duration] = useWatch({
    control: form.control,
    name: ["mode", "startTime", "endTime", "duration"],
  });
  const computedMinutes =
    mode === "range"
      ? timeToMinutes(endTime ?? "") - timeToMinutes(startTime ?? "")
      : durationToMinutes(duration ?? "");

  function save(values: AppointmentFormValues, keepOpen: boolean) {
    const taskId = values.taskId === NONE ? undefined : values.taskId;
    const task = data.tasks.find((item) => item.id === taskId);
    const title = values.title || task?.title || "";
    if (!title) {
      form.setError("title", {
        message: "Dê um título ou escolha uma tarefa",
      });
      return;
    }
    const startMinutes = timeToMinutes(values.startTime);
    const endMinutes =
      values.mode === "range"
        ? timeToMinutes(values.endTime)
        : startMinutes + durationToMinutes(values.duration);
    const record: Omit<Appointment, "id"> = {
      title,
      date: values.date,
      startTime: toTime(values.startTime),
      endTime: minutesToTime(endMinutes),
      taskId,
      note: values.note || undefined,
    };
    const clash = data.appointments.find(
      (other) =>
        other.id !== appointment?.id &&
        other.date === record.date &&
        timeToMinutes(other.startTime) < endMinutes &&
        startMinutes < timeToMinutes(other.endTime),
    );
    if (clash) {
      form.setError(values.mode === "range" ? "endTime" : "duration", {
        message: `Conflita com "${clash.title}" (${clash.startTime.slice(0, 5)}–${clash.endTime.slice(0, 5)})`,
      });
      return;
    }

    if (appointment) {
      dataActions.update("appointments", appointment.id, record);
      toast.success("Agendamento atualizado");
    } else {
      dataActions.create("appointments", record);
      toast.success(
        `Agendado das ${record.startTime.slice(0, 5)} às ${record.endTime.slice(0, 5)}`,
      );
    }
    rememberTask(values.taskId);

    if (!keepOpen) {
      onOpenChange(false);
      return;
    }
    const nextEnd = Math.min(endMinutes + (endMinutes - startMinutes), 1439);
    form.reset({
      ...values,
      title: "",
      note: "",
      startTime: minutesToTime(endMinutes),
      endTime: minutesToTime(nextEnd),
    });
  }

  function remove() {
    if (!appointment) return;
    dataActions.remove("appointments", appointment.id);
    toast.success("Agendamento excluído");
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b p-6 pr-12">
          <SheetTitle>
            {editing ? "Editar agendamento" : "Novo agendamento"}
          </SheetTitle>
          <SheetDescription>
            Reserve um intervalo na agenda, ligado ou não a uma tarefa.
          </SheetDescription>
        </SheetHeader>

        <form
          id="appointment-form"
          noValidate
          onSubmit={form.handleSubmit((values) => save(values, false))}
          className="flex flex-1 flex-col gap-5 p-6"
        >
          <FormField id="appointment-task" label="Tarefa">
            <Controller
              control={form.control}
              name="taskId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="appointment-task" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sem tarefa</SelectItem>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        <span className="truncate">{task.title}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField
            id="appointment-title"
            label="Título"
            hint="Vazio usa o título da tarefa."
            error={errors.title?.message}
          >
            <Input
              id="appointment-title"
              placeholder="Revisão do pull request"
              {...form.register("title")}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="appointment-date"
              label="Data"
              required
              error={errors.date?.message}
            >
              <Input
                id="appointment-date"
                type="date"
                {...form.register("date")}
              />
            </FormField>
            <div className="flex flex-col gap-2">
              <span className="text-sm leading-none font-medium">
                Como informar
              </span>
              <Controller
                control={form.control}
                name="mode"
                render={({ field }) => (
                  <div
                    role="radiogroup"
                    aria-label="Como informar"
                    className="inline-flex h-9 w-fit rounded-md border p-0.5"
                  >
                    {(
                      [
                        ["range", "Início e fim"],
                        ["duration", "Duração"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={field.value === value}
                        onClick={() => field.onChange(value)}
                        className={cn(
                          "rounded px-3 text-sm text-muted-foreground transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                          field.value === value &&
                            "bg-primary text-primary-foreground",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="appointment-start"
              label="Início"
              required
              error={errors.startTime?.message}
            >
              <Input
                id="appointment-start"
                type="time"
                step={1}
                {...form.register("startTime")}
              />
            </FormField>
            {mode === "range" ? (
              <FormField
                id="appointment-end"
                label="Fim"
                required
                error={errors.endTime?.message}
              >
                <Input
                  id="appointment-end"
                  type="time"
                  step={1}
                  {...form.register("endTime")}
                />
                {!errors.endTime && computedMinutes > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatDuration(computedMinutes)}
                  </span>
                )}
              </FormField>
            ) : (
              <FormField
                id="appointment-duration"
                label="Duração"
                required
                error={errors.duration?.message}
              >
                <Input
                  id="appointment-duration"
                  inputMode="numeric"
                  placeholder="1:30"
                  {...form.register("duration")}
                />
                {!errors.duration && computedMinutes > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    Termina às{" "}
                    {minutesToTime(
                      timeToMinutes(startTime ?? "") + computedMinutes,
                    ).slice(0, 5)}
                  </span>
                )}
              </FormField>
            )}
          </div>

          <FormField id="appointment-note" label="Nota">
            <Textarea
              id="appointment-note"
              placeholder="O que vai ser feito"
              rows={3}
              {...form.register("note")}
            />
          </FormField>

          <p className="flex gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-foreground">
            <Info className="size-4 shrink-0 text-primary" aria-hidden />
            Dois agendamentos não podem ocupar o mesmo horário.
          </p>
        </form>

        <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t bg-background p-4">
          <Button type="submit" form="appointment-form">
            {editing ? "Salvar" : "Agendar"}
          </Button>
          {!editing && (
            <Button
              type="button"
              variant="outline"
              onClick={form.handleSubmit((values) => save(values, true))}
            >
              Salvar e continuar
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          {editing && (
            <ConfirmDelete
              noun="agendamento"
              name={appointment?.title ?? ""}
              onConfirm={remove}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-auto text-destructive"
                  aria-label="Excluir agendamento"
                >
                  <Trash2 />
                </Button>
              }
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
