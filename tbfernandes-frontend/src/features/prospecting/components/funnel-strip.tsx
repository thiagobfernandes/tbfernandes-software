import { addDays, formatShort } from "@/lib/dates";
import type { Funnel } from "@/features/prospecting/lib/prospecting";
import { cn } from "@/lib/utils";

const percent = (part: number, whole: number) =>
  whole ? `${Math.round((part / whole) * 100)}%` : "—";

/**
 * The funnel as one connected strip (leads, contacted, replied, closed), each stage with
 * its share of the one before, and the messages sent per day beside it. Real counts only.
 */
export function FunnelStrip({
  funnel,
  today,
}: {
  funnel: Funnel;
  today: string;
}) {
  const stages = [
    {
      key: "leads",
      label: "Leads",
      value: funnel.leads,
      note: `${funnel.queued} na fila`,
    },
    {
      key: "contacted",
      label: "Contatados",
      value: funnel.contacted,
      note: `${percent(funnel.contacted, funnel.leads)} dos leads`,
    },
    {
      key: "replied",
      label: "Responderam",
      value: funnel.replied,
      note: `${percent(funnel.replied, funnel.contacted)} dos contatados`,
      lead: true,
    },
    {
      key: "converted",
      label: "Fecharam",
      value: funnel.converted,
      note: funnel.optedOut
        ? `${funnel.optedOut} pediram para sair`
        : `${percent(funnel.converted, funnel.replied)} das respostas`,
    },
  ];
  const top = Math.max(funnel.leads, 1);

  return (
    <section
      aria-label="Funil de prospecção"
      className="grid overflow-hidden rounded-xl border bg-card lg:grid-cols-[minmax(0,1fr)_17rem]"
    >
      <ol className="grid grid-cols-2 sm:grid-cols-4">
        {stages.map((stage, index) => (
          <li
            key={stage.key}
            className={cn(
              "flex min-w-0 flex-col gap-3 p-5",
              index > 0 && "sm:border-l",
              index > 1 && "border-t sm:border-t-0",
              index === 1 && "border-l",
            )}
          >
            <span className="text-sm text-muted-foreground">{stage.label}</span>
            <span
              className={cn(
                "font-light tracking-tight tabular-nums",
                stage.lead ? "text-5xl text-primary" : "text-4xl",
              )}
            >
              {stage.value}
            </span>
            <div
              className="h-1 overflow-hidden rounded-full bg-muted"
              aria-hidden
            >
              <div
                className={cn(
                  "h-full rounded-full",
                  stage.lead ? "bg-primary" : "bg-foreground/35",
                )}
                style={{ width: `${(stage.value / top) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{stage.note}</span>
          </li>
        ))}
      </ol>
      <SendsChart
        values={funnel.sentPerDay}
        today={today}
        total={funnel.sentRecently}
      />
    </section>
  );
}

function SendsChart({
  values,
  today,
  total,
}: {
  values: number[];
  today: string;
  total: number;
}) {
  const max = Math.max(...values, 1);
  const first = addDays(today, -(values.length - 1));
  return (
    <figure className="flex flex-col gap-3 border-t p-5 lg:border-t-0 lg:border-l">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-muted-foreground">Envios por dia</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {total} em {values.length} dias
        </span>
      </figcaption>
      <div
        role="img"
        aria-label={`Mensagens enviadas por dia nos últimos ${values.length} dias: ${values.join(", ")}`}
        className="flex h-20 items-end gap-1"
      >
        {values.map((value, index) => (
          <div
            key={index}
            title={`${formatShort(addDays(first, index))}: ${value}`}
            className={cn(
              "flex-1 rounded-sm",
              value ? "bg-primary/70" : "bg-muted",
              index === values.length - 1 && value > 0 && "bg-primary",
            )}
            style={{
              height: `${Math.max(value ? (value / max) * 100 : 6, 6)}%`,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{formatShort(first)}</span>
        <span>hoje</span>
      </div>
    </figure>
  );
}
