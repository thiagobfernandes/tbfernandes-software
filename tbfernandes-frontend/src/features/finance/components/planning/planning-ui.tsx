"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, PiggyBank } from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import {
  certaintyLabels,
  errorMessage,
  formatMonthLong,
  plusMonths,
  riskLabels,
} from "@/features/finance/lib/planning-format";
import type { Certainty, Risk } from "@/features/finance/types/planning";
import { env } from "@/lib/env";
import { currentDay } from "@/lib/today";
import { cn } from "@/lib/utils";

/** The plan only exists on the server; local mode shows how to turn it on. */
export function ApiOnly({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  if (env.dataSource === "api") return <>{children}</>;
  return (
    <PageContainer>
      <PageHeading title={title} />
      <EmptyState
        icon={PiggyBank}
        title="Disponível com a API"
        description="O planejamento calcula tudo no backend. Rode com NEXT_PUBLIC_DATA_SOURCE=api para usar esta tela."
      />
    </PageContainer>
  );
}

/** Loads from the API, with a reload to call after every change. */
export function useApiResource<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T>();
  const [failed, setFailed] = useState(false);

  const reload = useCallback(async () => {
    try {
      setData(await load());
      setFailed(false);
    } catch (error) {
      setFailed(true);
      toast.error(errorMessage(error));
    }
  }, [load]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load from the API
    void reload();
  }, [reload]);

  return { data, failed, reload };
}

/** Runs a change, shows its toast and reloads. */
export async function runAction(
  action: () => Promise<unknown>,
  success: string,
  reload?: () => Promise<void> | void,
) {
  try {
    await action();
    toast.success(success);
    await reload?.();
    return true;
  } catch (error) {
    toast.error(errorMessage(error));
    return false;
  }
}

const certaintyStyles: Record<Certainty, string> = {
  confirmed: "border-success/40 text-success",
  estimated: "border-warning/50 text-warning",
  unknown: "border-dashed text-muted-foreground",
};

/** Confirmed, estimated or unknown: shown next to every number of the plan. */
export function CertaintyBadge({
  certainty,
  className,
}: {
  certainty: Certainty;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] leading-none font-medium",
        certaintyStyles[certainty],
        className,
      )}
    >
      {certaintyLabels[certainty]}
    </span>
  );
}

const riskStyles: Record<Risk, string> = {
  low: "bg-success/10 text-success",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
};

export function RiskBadge({ risk }: { risk: Risk }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        riskStyles[risk],
      )}
    >
      Risco {riskLabels[risk].toLowerCase()}
    </span>
  );
}

export function MonthStepper({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Mês anterior"
        onClick={() => onChange(plusMonths(month, -1))}
      >
        <ChevronLeft />
      </Button>
      <span className="w-36 text-center text-sm font-medium" aria-live="polite">
        {formatMonthLong(month)}
      </span>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Próximo mês"
        onClick={() => onChange(plusMonths(month, 1))}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}

/** Today's month, the default of every planning screen. */
export function thisMonth() {
  return currentDay().slice(0, 7);
}
