"use client";

import { useCallback, useState } from "react";
import {
  CheckCircle2,
  Pencil,
  PiggyBank,
  Plus,
  ShieldCheck,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { EntityFormDialog } from "@/components/shared/entity-form-dialog";
import { PageHeading } from "@/components/shared/page-heading";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ProgressBar } from "@/components/shared/progress-bar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { planningApi } from "@/features/finance/lib/planning-api";
import {
  formatMoney,
  fundKindLabels,
} from "@/features/finance/lib/planning-format";
import {
  fundSchema,
  movementSchema,
} from "@/features/finance/schemas/planning-schema";
import type {
  CreditCard,
  ReserveFund,
  ReserveMovement,
} from "@/features/finance/types/planning";
import { formatShort } from "@/lib/dates";
import { currentDay } from "@/lib/today";
import { cn } from "@/lib/utils";

import { GoalCard } from "./goal-card";
import { ApiOnly, runAction, useApiResource } from "./planning-ui";

export function ReservesPage() {
  return (
    <ApiOnly title="Reservas e metas">
      <Reserves />
    </ApiOnly>
  );
}

type Dialog =
  | { kind: "fund"; fund?: ReserveFund }
  | { kind: "movement"; fund: ReserveFund; movement?: ReserveMovement };

function Reserves() {
  const loadFunds = useCallback(() => planningApi.funds(), []);
  const loadCards = useCallback(() => planningApi.cards(), []);
  const loadOverview = useCallback(() => planningApi.overview(), []);
  const funds = useApiResource(loadFunds);
  const cards = useApiResource(loadCards);
  const overview = useApiResource(loadOverview);
  const [dialog, setDialog] = useState<Dialog>();
  const reload = useCallback(async () => {
    await Promise.all([funds.reload(), overview.reload()]);
  }, [funds, overview]);

  const confirmed = (funds.data ?? []).reduce(
    (sum, fund) => sum + fund.balance,
    0,
  );
  const pending = (funds.data ?? []).reduce(
    (sum, fund) => sum + fund.pending,
    0,
  );

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Reservas e metas"
        description="Dinheiro guardado fica separado do saldo da conta. Valores a receber só contam depois de confirmados."
        actions={
          <Button onClick={() => setDialog({ kind: "fund" })}>
            <Plus /> Nova reserva
          </Button>
        }
      />
      {funds.data && funds.data.length > 0 && (
        <p className="text-sm">
          Guardado confirmado:{" "}
          <strong className="tabular-nums">{formatMoney(confirmed)}</strong>
          {pending > 0 && (
            <span className="text-muted-foreground">
              {" "}
              · potencial {formatMoney(confirmed + pending)} quando chegarem{" "}
              {formatMoney(pending)}
            </span>
          )}
        </p>
      )}
      {!funds.data ? (
        <PageSkeleton />
      ) : funds.data.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="Nenhuma reserva"
          description="Crie a reserva de emergência (protegida) e uma para a viagem."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {funds.data.map((fund) => {
            const goal = overview.data?.goals.find(
              (item) => item.fundId === fund.id,
            );
            return (
              <div key={fund.id} className="flex flex-col gap-4">
                <FundCard
                  fund={fund}
                  onEdit={() => setDialog({ kind: "fund", fund })}
                  onMovement={(movement) =>
                    setDialog({ kind: "movement", fund, movement })
                  }
                  onChanged={reload}
                />
                {goal && <GoalCard goal={goal} />}
              </div>
            );
          })}
        </div>
      )}
      <FundDialog
        open={dialog?.kind === "fund"}
        fund={dialog?.kind === "fund" ? dialog.fund : undefined}
        cards={cards.data ?? []}
        onClose={() => setDialog(undefined)}
        onDone={reload}
      />
      {dialog?.kind === "movement" && (
        <MovementDialog
          fund={dialog.fund}
          movement={dialog.movement}
          onClose={() => setDialog(undefined)}
          onDone={reload}
        />
      )}
    </PageContainer>
  );
}

function FundCard({
  fund,
  onEdit,
  onMovement,
  onChanged,
}: {
  fund: ReserveFund;
  onEdit: () => void;
  onMovement: (movement?: ReserveMovement) => void;
  onChanged: () => Promise<void>;
}) {
  return (
    <Card className="gap-3 rounded-lg">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            {fund.protected ? (
              <ShieldCheck className="size-4 text-success" aria-hidden />
            ) : (
              <PiggyBank className="size-4 text-primary" aria-hidden />
            )}
            {fund.name}
          </CardTitle>
          <CardDescription>
            {fundKindLabels[fund.kind]}
            {fund.protected && " · protegida, não entra nos gastos"}
          </CardDescription>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => onMovement()}>
            <Plus /> Movimentar
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Editar ${fund.name}`}
            onClick={onEdit}
          >
            <Pencil />
          </Button>
          <ConfirmDelete
            noun="reserva"
            name={fund.name}
            onConfirm={() =>
              runAction(
                () => planningApi.deleteFund(fund.id),
                "Reserva excluída",
                onChanged,
              )
            }
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <div className="flex flex-wrap items-baseline gap-x-4">
          <span className="text-2xl font-semibold tabular-nums">
            {formatMoney(fund.balance)}
          </span>
          {fund.pending > 0 && (
            <span className="text-xs text-muted-foreground">
              + {formatMoney(fund.pending)} a receber →{" "}
              {formatMoney(fund.potentialBalance)}
            </span>
          )}
        </div>
        {fund.target !== null && (
          <ProgressBar
            value={(fund.balance / fund.target) * 100}
            label={`${formatMoney(fund.balance)} de ${formatMoney(fund.target)}`}
          />
        )}
        {fund.movements.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem movimentações.</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-md border text-xs">
            {fund.movements.map((movement) => (
              <li
                key={movement.id}
                className="flex flex-wrap items-center gap-x-3 px-3 py-1.5"
              >
                <span className="w-12 text-muted-foreground tabular-nums">
                  {formatShort(movement.date)}
                </span>
                <span className="flex-1">
                  {movement.kind === "deposit" ? "Aporte" : "Retirada"}
                  {movement.source === "external" &&
                    (movement.contributor
                      ? ` de ${movement.contributor}`
                      : " (de fora)")}
                  {movement.note && (
                    <span className="text-muted-foreground">
                      {" "}
                      · {movement.note}
                    </span>
                  )}
                </span>
                {movement.status === "expected" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px]"
                    onClick={() =>
                      runAction(
                        () =>
                          planningApi.updateMovement(fund.id, movement.id, {
                            ...movement,
                            status: "confirmed",
                            date:
                              currentDay() > movement.date
                                ? currentDay()
                                : movement.date,
                          }),
                        "Recebimento confirmado",
                        onChanged,
                      )
                    }
                  >
                    <CheckCircle2 /> Confirmar
                  </Button>
                ) : null}
                <span
                  className={cn(
                    "w-24 text-right tabular-nums",
                    movement.kind === "withdrawal" && "text-destructive",
                    movement.status === "expected" &&
                      "text-muted-foreground italic",
                  )}
                >
                  {movement.kind === "withdrawal" ? "−" : "+"}
                  {formatMoney(movement.amount)}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Editar movimentação"
                  onClick={() => onMovement(movement)}
                >
                  <Pencil />
                </Button>
                <ConfirmDelete
                  noun="movimentação"
                  name={`${formatShort(movement.date)} ${formatMoney(movement.amount)}`}
                  onConfirm={() =>
                    runAction(
                      () => planningApi.removeMovement(fund.id, movement.id),
                      "Movimentação removida",
                      onChanged,
                    )
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function FundDialog({
  open,
  fund,
  cards,
  onClose,
  onDone,
}: {
  open: boolean;
  fund?: ReserveFund;
  cards: CreditCard[];
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const purchases = cards.flatMap((card) =>
    card.purchases.map((purchase) => ({
      value: purchase.id,
      label: `${purchase.description} (${card.name})`,
    })),
  );
  return (
    <EntityFormDialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={fund ? "Editar reserva" : "Nova reserva"}
      description="Protegida = não se gasta (emergência). Para a viagem, ligue a compra parcelada do pacote e informe a contribuição prometida."
      schema={fundSchema}
      submitLabel={fund ? "Salvar" : "Criar"}
      defaults={{
        name: fund?.name ?? "",
        kind: fund?.kind ?? "goal",
        protected: fund?.protected ?? false,
        target: fund?.target ?? undefined,
        targetMonth: fund?.targetMonth ?? "",
        expectedContribution: fund?.expectedContribution ?? 0,
        contributorName: fund?.contributorName ?? "",
        purchaseId: fund?.purchaseId ?? "",
      }}
      fields={[
        {
          name: "name",
          label: "Nome",
          type: "text",
          required: true,
          full: true,
        },
        {
          name: "kind",
          label: "Tipo",
          type: "select",
          options: Object.entries(fundKindLabels).map(([value, label]) => ({
            value,
            label,
          })),
        },
        {
          name: "protected",
          label: "Protegida (não gastar)",
          type: "checkbox",
        },
        { name: "target", label: "Meta", type: "number", step: 0.01 },
        { name: "targetMonth", label: "Até (AAAA-MM)", type: "text" },
        { name: "contributorName", label: "Quem vai contribuir", type: "text" },
        {
          name: "expectedContribution",
          label: "Contribuição prometida",
          type: "number",
          step: 0.01,
          hint: "Zero até estar definida.",
        },
        {
          name: "purchaseId",
          label: "Compra parcelada ligada",
          type: "select",
          optional: true,
          options: purchases,
          full: true,
        },
      ]}
      onSubmit={async (values) => {
        const input = {
          name: values.name,
          kind: values.kind,
          protected: values.protected,
          target: values.target ?? null,
          targetMonth: values.targetMonth || null,
          expectedContribution: values.expectedContribution ?? 0,
          contributorName: values.contributorName || null,
          purchaseId: values.purchaseId || null,
        };
        const ok = await runAction(
          () =>
            fund
              ? planningApi.updateFund(fund.id, input)
              : planningApi.createFund(input),
          fund ? "Reserva atualizada" : "Reserva criada",
          onDone,
        );
        if (ok) onClose();
      }}
    />
  );
}

function MovementDialog({
  fund,
  movement,
  onClose,
  onDone,
}: {
  fund: ReserveFund;
  movement?: ReserveMovement;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  return (
    <EntityFormDialog
      open
      onOpenChange={(next) => !next && onClose()}
      title={movement ? "Editar movimentação" : `Movimentar ${fund.name}`}
      description="Da conta: sai do saldo da conta (não é despesa). De fora: dinheiro recebido direto na reserva, como uma contribuição. A receber: ainda não chegou."
      schema={movementSchema}
      submitLabel="Salvar"
      defaults={{
        date: movement?.date ?? currentDay(),
        kind: movement?.kind ?? "deposit",
        source: movement?.source ?? "account",
        status: movement?.status ?? "confirmed",
        amount: movement?.amount as number,
        contributor: movement?.contributor ?? "",
        note: movement?.note ?? "",
      }}
      fields={[
        { name: "date", label: "Data", type: "date", required: true },
        {
          name: "amount",
          label: "Valor",
          type: "number",
          step: 0.01,
          required: true,
        },
        {
          name: "kind",
          label: "Tipo",
          type: "select",
          options: [
            { value: "deposit", label: "Aporte" },
            { value: "withdrawal", label: "Retirada" },
          ],
        },
        {
          name: "source",
          label: "Origem",
          type: "select",
          options: [
            { value: "account", label: "Da conta" },
            { value: "external", label: "De fora" },
          ],
        },
        {
          name: "status",
          label: "Situação",
          type: "select",
          options: [
            { value: "confirmed", label: "Confirmado" },
            { value: "expected", label: "A receber" },
          ],
        },
        { name: "contributor", label: "Quem contribuiu", type: "text" },
        { name: "note", label: "Observação", type: "text", full: true },
      ]}
      onSubmit={async (values) => {
        const input = {
          ...values,
          contributor: values.contributor || null,
          note: values.note || null,
        };
        const ok = await runAction(
          () =>
            movement
              ? planningApi.updateMovement(fund.id, movement.id, input)
              : planningApi.addMovement(fund.id, input),
          "Movimentação salva",
          onDone,
        );
        if (ok) onClose();
      }}
    />
  );
}
