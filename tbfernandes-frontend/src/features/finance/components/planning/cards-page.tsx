"use client";

import { useCallback, useRef, useState } from "react";
import {
  ChevronDown,
  CreditCard as CardIcon,
  FileUp,
  Pencil,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/page-container";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { EntityFormDialog } from "@/components/shared/entity-form-dialog";
import { PageHeading } from "@/components/shared/page-heading";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { planningApi } from "@/features/finance/lib/planning-api";
import {
  errorMessage,
  formatMoney,
  formatMonthShort,
} from "@/features/finance/lib/planning-format";
import {
  cardSchema,
  certaintyOptions,
  purchaseSchema,
  statementSchema,
} from "@/features/finance/schemas/planning-schema";
import type {
  CardPurchase,
  CardStatement,
  Commitment,
  CreditCard,
} from "@/features/finance/types/planning";
import { formatShort } from "@/lib/dates";
import { cn } from "@/lib/utils";

import {
  CertaintyBadge,
  ApiOnly,
  runAction,
  thisMonth,
  useApiResource,
} from "./planning-ui";

const UNCLASSIFIED = "__none";

export function CardsPage() {
  return (
    <ApiOnly title="Cartões">
      <Cards />
    </ApiOnly>
  );
}

type Dialog =
  | { kind: "card"; card?: CreditCard }
  | { kind: "statement"; card: CreditCard }
  | { kind: "purchase"; card: CreditCard; purchase?: CardPurchase };

function Cards() {
  const loadCards = useCallback(() => planningApi.cards(), []);
  const loadCommitments = useCallback(() => planningApi.commitments(), []);
  const { data: cards, reload } = useApiResource(loadCards);
  const { data: commitments } = useApiResource(loadCommitments);
  const [dialog, setDialog] = useState<Dialog>();
  const subscriptions = (commitments ?? []).filter(
    (item) => item.category === "subscription",
  );

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Cartões"
        description="Importe o CSV da fatura (date, title, amount). Importar de novo o mesmo arquivo não duplica nada, e as compras dentro da fatura nunca somam por fora."
        actions={
          <Button onClick={() => setDialog({ kind: "card" })}>
            <Plus /> Novo cartão
          </Button>
        }
      />
      {!cards ? (
        <PageSkeleton />
      ) : cards.length === 0 ? (
        <EmptyState
          icon={CardIcon}
          title="Nenhum cartão"
          description="Cadastre o cartão e importe as faturas em CSV."
        />
      ) : (
        cards.map((card) => (
          <CardPanel
            key={card.id}
            card={card}
            subscriptions={subscriptions}
            onChanged={reload}
            onEdit={() => setDialog({ kind: "card", card })}
            onStatement={() => setDialog({ kind: "statement", card })}
            onPurchase={(purchase) =>
              setDialog({ kind: "purchase", card, purchase })
            }
          />
        ))
      )}
      <CardDialog
        open={dialog?.kind === "card"}
        card={dialog?.kind === "card" ? dialog.card : undefined}
        onClose={() => setDialog(undefined)}
        onDone={reload}
      />
      {dialog?.kind === "statement" && (
        <StatementDialog
          card={dialog.card}
          onClose={() => setDialog(undefined)}
          onDone={reload}
        />
      )}
      {dialog?.kind === "purchase" && (
        <PurchaseDialog
          card={dialog.card}
          purchase={dialog.purchase}
          onClose={() => setDialog(undefined)}
          onDone={reload}
        />
      )}
    </PageContainer>
  );
}

function CardPanel({
  card,
  subscriptions,
  onChanged,
  onEdit,
  onStatement,
  onPurchase,
}: {
  card: CreditCard;
  subscriptions: Commitment[];
  onChanged: () => Promise<void>;
  onEdit: () => void;
  onStatement: () => void;
  onPurchase: (purchase?: CardPurchase) => void;
}) {
  return (
    <Card className="gap-4 rounded-lg">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <CardIcon className="size-4 text-primary" aria-hidden />
            {card.name}
          </CardTitle>
          <CardDescription>
            {card.scope === "business" ? "Empresa (PJ)" : "Pessoal"} · vence dia{" "}
            {card.dueDay}
            {card.monthlyEstimate !== null &&
              ` · previsão de ${formatMoney(card.monthlyEstimate)}/mês sem fatura${card.estimateFrom ? ` desde ${formatMonthShort(card.estimateFrom)}` : ""}`}
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportButton card={card} onDone={onChanged} />
          <Button variant="outline" size="sm" onClick={onStatement}>
            Lançar fatura à mão
          </Button>
          <Button variant="outline" size="sm" onClick={() => onPurchase()}>
            <ShoppingBag /> Compra parcelada
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Editar ${card.name}`}
            onClick={onEdit}
          >
            <Pencil />
          </Button>
          <ConfirmDelete
            noun="cartão"
            name={card.name}
            onConfirm={() =>
              runAction(
                () => planningApi.deleteCard(card.id),
                "Cartão excluído",
                onChanged,
              )
            }
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {card.statements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma fatura ainda.</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-md border">
            {card.statements.map((statement) => (
              <StatementRow
                key={statement.month}
                card={card}
                statement={statement}
                subscriptions={subscriptions}
                onChanged={onChanged}
              />
            ))}
          </ul>
        )}
        {card.purchases.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Compras parceladas
            </h3>
            {card.purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex flex-wrap items-center gap-x-3 text-sm"
              >
                <span className="flex-1 font-medium">
                  {purchase.description}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatMoney(purchase.total)} em {purchase.installments}x de{" "}
                  {formatMoney(purchase.installmentAmount)}
                  {purchase.withInterest ? " (com juros)" : " sem juros"} · a
                  partir de {formatMonthShort(purchase.firstMonth)}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Editar ${purchase.description}`}
                  onClick={() => onPurchase(purchase)}
                >
                  <Pencil />
                </Button>
                <ConfirmDelete
                  noun="compra parcelada"
                  name={purchase.description}
                  onConfirm={() =>
                    runAction(
                      () => planningApi.removePurchase(card.id, purchase.id),
                      "Compra removida",
                      onChanged,
                    )
                  }
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** "Nubank_2027-01-19.csv" → due date 2027-01-19. */
function dueDateFromName(name: string, dueDay: number) {
  const match = /(\d{4}-\d{2}-\d{2})/.exec(name);
  return match ? match[1] : `${thisMonth()}-${String(dueDay).padStart(2, "0")}`;
}

function ImportButton({
  card,
  onDone,
}: {
  card: CreditCard;
  onDone: () => Promise<void>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [dueDate, setDueDate] = useState("");

  async function submit() {
    if (!file) return;
    try {
      const result = await planningApi.importStatement(
        card.id,
        dueDate,
        await file.text(),
      );
      toast.success(
        `Fatura de ${formatMonthShort(result.month)}: ${result.imported} novas, ${result.skipped} já existiam · total ${formatMoney(result.total)}`,
      );
      setFile(undefined);
      await onDone();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        aria-label={`CSV da fatura do ${card.name}`}
        onChange={(event) => {
          const chosen = event.target.files?.[0];
          if (!chosen) return;
          setFile(chosen);
          setDueDate(dueDateFromName(chosen.name, card.dueDay));
          event.target.value = "";
        }}
      />
      {file ? (
        <div className="flex items-center gap-2 rounded-md border px-2 py-1 text-xs">
          <span className="max-w-32 truncate">{file.name}</span>
          <label className="flex items-center gap-1">
            vence
            <Input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="h-7 w-36"
            />
          </label>
          <Button size="sm" onClick={submit} disabled={!dueDate}>
            Importar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setFile(undefined)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <Button size="sm" onClick={() => input.current?.click()}>
          <FileUp /> Importar CSV
        </Button>
      )}
    </>
  );
}

function StatementRow({
  card,
  statement,
  subscriptions,
  onChanged,
}: {
  card: CreditCard;
  statement: CardStatement;
  subscriptions: Commitment[];
  onChanged: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const transactions = card.transactions.filter(
    (item) => item.statementMonth === statement.month,
  );
  return (
    <li className="flex flex-col">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
        <button
          type="button"
          className="flex flex-1 items-center gap-1.5 text-left font-medium"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          disabled={transactions.length === 0}
        >
          {transactions.length > 0 && (
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform",
                !open && "-rotate-90",
              )}
              aria-hidden
            />
          )}
          {formatMonthShort(statement.month)}
          <span className="text-xs font-normal text-muted-foreground normal-case">
            vence {formatShort(statement.dueDate)} ·{" "}
            {statement.source === "imported"
              ? `${transactions.length} lançamentos importados`
              : "lançada à mão"}
          </span>
        </button>
        <CertaintyBadge certainty={statement.certainty} />
        <span className="w-28 text-right font-medium tabular-nums">
          {formatMoney(statement.total)}
        </span>
        <span className="w-32 text-right text-xs text-muted-foreground">
          {statement.paidAmount !== null
            ? `pago ${formatMoney(statement.paidAmount)}`
            : "em aberto"}
        </span>
        <ConfirmDelete
          noun="fatura"
          name={formatMonthShort(statement.month)}
          onConfirm={() =>
            runAction(
              () => planningApi.removeStatement(card.id, statement.month),
              "Fatura excluída",
              onChanged,
            )
          }
        />
      </div>
      {open && (
        <ul className="flex flex-col gap-1 border-t bg-muted/30 px-3 py-2 text-xs">
          {transactions.map((transaction) => (
            <li
              key={transaction.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1"
            >
              <span className="w-12 text-muted-foreground tabular-nums">
                {formatShort(transaction.date)}
              </span>
              <span className="min-w-0 flex-1 truncate">
                {transaction.title}
              </span>
              {subscriptions.length > 0 && (
                <Select
                  value={transaction.commitmentId ?? UNCLASSIFIED}
                  onValueChange={(value) =>
                    runAction(
                      () =>
                        planningApi.classify(
                          card.id,
                          transaction.id,
                          value === UNCLASSIFIED ? null : value,
                        ),
                      "Classificação salva",
                      onChanged,
                    )
                  }
                >
                  <SelectTrigger
                    size="sm"
                    className="h-6 w-40 text-[11px]"
                    aria-label="Assinatura"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNCLASSIFIED}>
                      Não é assinatura
                    </SelectItem>
                    {subscriptions.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        Assinatura: {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <span className="w-20 text-right tabular-nums">
                {formatMoney(transaction.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function CardDialog({
  open,
  card,
  onClose,
  onDone,
}: {
  open: boolean;
  card?: CreditCard;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  return (
    <EntityFormDialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={card ? "Editar cartão" : "Novo cartão"}
      description="A previsão mensal só entra nos meses sem fatura importada ou lançada (ex.: um cartão que você ainda não exporta)."
      schema={cardSchema}
      submitLabel={card ? "Salvar" : "Adicionar"}
      defaults={{
        name: card?.name ?? "",
        scope: card?.scope ?? "personal",
        dueDay: card?.dueDay as number,
        monthlyEstimate: card?.monthlyEstimate ?? undefined,
        estimateFrom: card?.estimateFrom ?? "",
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
          name: "scope",
          label: "Escopo",
          type: "select",
          options: [
            { value: "personal", label: "Pessoal" },
            { value: "business", label: "Empresa (PJ)" },
          ],
        },
        {
          name: "dueDay",
          label: "Dia do vencimento",
          type: "number",
          min: 1,
          required: true,
        },
        {
          name: "monthlyEstimate",
          label: "Previsão mensal",
          type: "number",
          step: 0.01,
        },
        {
          name: "estimateFrom",
          label: "Previsão a partir de (AAAA-MM)",
          type: "text",
        },
      ]}
      onSubmit={async (values) => {
        const input = {
          ...values,
          monthlyEstimate: values.monthlyEstimate ?? null,
          estimateFrom: values.estimateFrom || null,
        };
        const ok = await runAction(
          () =>
            card
              ? planningApi.updateCard(card.id, input)
              : planningApi.createCard(input),
          card ? "Cartão atualizado" : "Cartão adicionado",
          onDone,
        );
        if (ok) onClose();
      }}
    />
  );
}

function StatementDialog({
  card,
  onClose,
  onDone,
}: {
  card: CreditCard;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  return (
    <EntityFormDialog
      open
      onOpenChange={(next) => !next && onClose()}
      title={`Fatura do ${card.name}`}
      description="Para um cartão sem CSV. Faturas importadas não podem ser editadas à mão: importe o arquivo novo."
      schema={statementSchema}
      submitLabel="Salvar fatura"
      defaults={{
        month: thisMonth(),
        total: undefined as unknown as number,
        certainty: "confirmed",
      }}
      fields={[
        {
          name: "month",
          label: "Mês do vencimento (AAAA-MM)",
          type: "text",
          required: true,
        },
        {
          name: "total",
          label: "Total",
          type: "number",
          step: 0.01,
          required: true,
        },
        {
          name: "certainty",
          label: "Certeza",
          type: "select",
          options: certaintyOptions,
        },
      ]}
      onSubmit={async (values) => {
        const ok = await runAction(
          () =>
            planningApi.setStatement(
              card.id,
              values.month,
              values.total,
              values.certainty,
            ),
          "Fatura salva",
          onDone,
        );
        if (ok) onClose();
      }}
    />
  );
}

function PurchaseDialog({
  card,
  purchase,
  onClose,
  onDone,
}: {
  card: CreditCard;
  purchase?: CardPurchase;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  return (
    <EntityFormDialog
      open
      onOpenChange={(next) => !next && onClose()}
      title={
        purchase
          ? "Editar compra parcelada"
          : `Compra parcelada no ${card.name}`
      }
      description="As parcelas entram nas faturas seguintes. Quando a fatura do mês for importada, ela já traz a parcela e nada soma de novo."
      schema={purchaseSchema}
      submitLabel={purchase ? "Salvar" : "Adicionar"}
      defaults={{
        description: purchase?.description ?? "",
        total: purchase?.total as number,
        installments: purchase?.installments ?? 12,
        firstMonth: purchase?.firstMonth ?? thisMonth(),
        withInterest: purchase?.withInterest ?? false,
        installmentAmount: purchase?.withInterest
          ? purchase.installmentAmount
          : undefined,
      }}
      fields={[
        {
          name: "description",
          label: "Descrição",
          type: "text",
          required: true,
          full: true,
        },
        {
          name: "total",
          label: "Valor total",
          type: "number",
          step: 0.01,
          required: true,
        },
        {
          name: "installments",
          label: "Parcelas",
          type: "number",
          min: 1,
          required: true,
        },
        {
          name: "firstMonth",
          label: "Primeira fatura (AAAA-MM)",
          type: "text",
          required: true,
        },
        { name: "withInterest", label: "Com juros", type: "checkbox" },
        {
          name: "installmentAmount",
          label: "Valor da parcela (com juros)",
          type: "number",
          step: 0.01,
        },
      ]}
      onSubmit={async (values) => {
        const input = {
          ...values,
          installmentAmount: values.installmentAmount ?? null,
        };
        const ok = await runAction(
          () =>
            purchase
              ? planningApi.updatePurchase(card.id, purchase.id, input)
              : planningApi.addPurchase(card.id, input),
          purchase ? "Compra atualizada" : "Compra adicionada",
          onDone,
        );
        if (ok) onClose();
      }}
    />
  );
}
