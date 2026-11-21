"use client";

import { useCallback, useState } from "react";
import {
  CalendarRange,
  MoreHorizontal,
  Pencil,
  Plus,
  Repeat,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { EntityFormDialog } from "@/components/shared/entity-form-dialog";
import { PageHeading } from "@/components/shared/page-heading";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { planningApi } from "@/features/finance/lib/planning-api";
import {
  categoryLabels,
  formatMoney,
  formatMonthShort,
} from "@/features/finance/lib/planning-format";
import {
  certaintyOptions,
  changeSchema,
  commitmentSchema,
  monthValueSchema,
} from "@/features/finance/schemas/planning-schema";
import type {
  Commitment,
  CommitmentCategory,
  CreditCard,
} from "@/features/finance/types/planning";

import {
  ApiOnly,
  CertaintyBadge,
  runAction,
  thisMonth,
  useApiResource,
} from "./planning-ui";

const NONE = "";

export function CommitmentsPage() {
  return (
    <ApiOnly title="Compromissos">
      <Commitments />
    </ApiOnly>
  );
}

type Dialog =
  | { kind: "edit"; item?: Commitment }
  | { kind: "change"; item: Commitment }
  | { kind: "month"; item: Commitment };

function Commitments() {
  const loadCommitments = useCallback(() => planningApi.commitments(), []);
  const loadCards = useCallback(() => planningApi.cards(), []);
  const { data: commitments, reload } = useApiResource(loadCommitments);
  const { data: cards } = useApiResource(loadCards);
  const [dialog, setDialog] = useState<Dialog>();
  const close = () => setDialog(undefined);

  const categories = Object.keys(categoryLabels) as CommitmentCategory[];

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Compromissos"
        description="Salário, freelances, empréstimos, contas fixas e assinaturas. Mudar um valor a partir de um mês nunca altera os meses anteriores."
        actions={
          <Button onClick={() => setDialog({ kind: "edit" })}>
            <Plus /> Novo compromisso
          </Button>
        }
      />
      {!commitments ? (
        <PageSkeleton />
      ) : commitments.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Nenhum compromisso ainda"
          description="Cadastre seu salário, as parcelas dos empréstimos e as contas do mês."
        />
      ) : (
        categories.map((category) => {
          const items = commitments.filter(
            (item) => item.category === category,
          );
          if (items.length === 0) return null;
          return (
            <section key={category} className="flex flex-col gap-2">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {categoryLabels[category]}
              </h2>
              <Card className="gap-0 rounded-lg py-0">
                <ul>
                  {items.map((item) => (
                    <CommitmentRow
                      key={item.id}
                      item={item}
                      cards={cards ?? []}
                      onEdit={() => setDialog({ kind: "edit", item })}
                      onChange={() => setDialog({ kind: "change", item })}
                      onMonth={() => setDialog({ kind: "month", item })}
                      onDelete={() =>
                        runAction(
                          () => planningApi.deleteCommitment(item.id),
                          "Compromisso excluído",
                          reload,
                        )
                      }
                    />
                  ))}
                </ul>
              </Card>
            </section>
          );
        })
      )}
      <CommitmentDialog
        open={dialog?.kind === "edit"}
        item={dialog?.kind === "edit" ? dialog.item : undefined}
        cards={cards ?? []}
        onClose={close}
        onDone={reload}
      />
      {dialog?.kind === "change" && (
        <ChangeDialog item={dialog.item} onClose={close} onDone={reload} />
      )}
      {dialog?.kind === "month" && (
        <MonthDialog item={dialog.item} onClose={close} onDone={reload} />
      )}
    </PageContainer>
  );
}

function currentChange(item: Commitment) {
  const month = thisMonth();
  return (
    item.changes.findLast((change) => change.fromMonth <= month) ??
    item.changes[0]
  );
}

function period(item: Commitment) {
  const end = item.endMonth ?? item.lastMonth;
  const start = formatMonthShort(item.startMonth);
  if (item.startMonth === end) return start;
  return end ? `${start} a ${formatMonthShort(end)}` : `desde ${start}`;
}

function CommitmentRow({
  item,
  cards,
  onEdit,
  onChange,
  onMonth,
  onDelete,
}: {
  item: Commitment;
  cards: CreditCard[];
  onEdit: () => void;
  onChange: () => void;
  onMonth: () => void;
  onDelete: () => void;
}) {
  const change = currentChange(item);
  const card = cards.find((entry) => entry.id === item.cardId);
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b px-4 py-3 last:border-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{item.name}</span>
        <span className="text-xs text-muted-foreground">
          {period(item)}
          {item.dueDay && ` · dia ${item.dueDay}`}
          {item.total !== null && ` · total ${formatMoney(item.total)}`}
          {card && ` · na fatura do ${card.name} (não soma de novo)`}
          {item.overrides.length > 0 &&
            ` · ${item.overrides.length} mês(es) com valor próprio`}
          {item.changes.length > 1 && ` · ${item.changes.length} alterações`}
        </span>
        {item.notes && (
          <span className="text-xs text-muted-foreground">{item.notes}</span>
        )}
      </div>
      {!change.active && (
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          suspenso desde {formatMonthShort(change.fromMonth)}
        </span>
      )}
      <CertaintyBadge certainty={change.certainty} />
      <span className="w-28 text-right text-sm font-medium tabular-nums">
        {formatMoney(change.amount)}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Ações de ${item.name}`}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onChange}>
            <Repeat /> Mudar a partir de um mês
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onMonth}>
            <CalendarRange /> Valor de um mês só
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil /> Editar dados
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDelete noun="compromisso" name={item.name} onConfirm={onDelete} />
    </li>
  );
}

function CommitmentDialog({
  open,
  item,
  cards,
  onClose,
  onDone,
}: {
  open: boolean;
  item?: Commitment;
  cards: CreditCard[];
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const change = item ? currentChange(item) : undefined;
  return (
    <EntityFormDialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={item ? "Editar compromisso" : "Novo compromisso"}
      description="Dívida com total termina sozinha quando as parcelas chegam nele. Assinatura no cartão: escolha o cartão para ela não somar duas vezes."
      schema={commitmentSchema}
      submitLabel={item ? "Salvar" : "Adicionar"}
      defaults={{
        name: item?.name ?? "",
        category: item?.category ?? "fixed",
        amount: change?.amount as number,
        certainty: change?.certainty ?? "confirmed",
        dueDay: item?.dueDay ?? undefined,
        startMonth: item?.startMonth ?? thisMonth(),
        endMonth: item?.endMonth ?? "",
        total: item?.total ?? undefined,
        cardId: item?.cardId ?? NONE,
        notes: item?.notes ?? "",
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
          name: "category",
          label: "Tipo",
          type: "select",
          options: Object.entries(categoryLabels).map(([value, label]) => ({
            value,
            label,
          })),
        },
        {
          name: "amount",
          label: item ? "Valor (use “mudar a partir de”)" : "Valor por mês",
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
        { name: "dueDay", label: "Dia do vencimento", type: "number", min: 1 },
        {
          name: "startMonth",
          label: "Primeiro mês (AAAA-MM)",
          type: "text",
          required: true,
        },
        {
          name: "endMonth",
          label: "Último mês (vazio = sem fim)",
          type: "text",
        },
        {
          name: "total",
          label: "Total da dívida",
          type: "number",
          step: 0.01,
          hint: "Só para empréstimos e dívidas.",
        },
        {
          name: "cardId",
          label: "Cobrado no cartão",
          type: "select",
          optional: true,
          options: cards.map((card) => ({ value: card.id, label: card.name })),
        },
        {
          name: "notes",
          label: "Observações",
          type: "textarea",
          rows: 2,
          full: true,
        },
      ]}
      onSubmit={async (values) => {
        const input = {
          name: values.name,
          category: values.category,
          dueDay: values.dueDay ?? null,
          startMonth: values.startMonth,
          endMonth: values.endMonth || null,
          total: values.total ?? null,
          cardId: values.cardId || null,
          notes: values.notes || null,
        };
        const ok = await runAction(
          () =>
            item
              ? planningApi.updateCommitment(item.id, input)
              : planningApi.createCommitment({
                  ...input,
                  amount: values.amount,
                  certainty: values.certainty,
                  note: null,
                }),
          item ? "Compromisso atualizado" : "Compromisso adicionado",
          onDone,
        );
        if (ok) onClose();
      }}
    />
  );
}

function ChangeDialog({
  item,
  onClose,
  onDone,
}: {
  item: Commitment;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const change = currentChange(item);
  return (
    <EntityFormDialog
      open
      onOpenChange={(next) => !next && onClose()}
      title={`Mudar ${item.name}`}
      description="Vale do mês escolhido em diante. Os meses anteriores continuam com o valor antigo. Desmarque “ativo” para suspender (ex.: cancelar uma assinatura)."
      schema={changeSchema}
      submitLabel="Aplicar"
      defaults={{
        fromMonth: thisMonth(),
        amount: change.amount,
        active: change.active,
        certainty: change.certainty,
        note: "",
      }}
      fields={[
        {
          name: "fromMonth",
          label: "A partir de (AAAA-MM)",
          type: "text",
          required: true,
        },
        {
          name: "amount",
          label: "Valor",
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
        { name: "active", label: "Ativo", type: "checkbox" },
        { name: "note", label: "Observação", type: "text", full: true },
      ]}
      onSubmit={async (values) => {
        const ok = await runAction(
          () =>
            planningApi.changeFrom(item.id, {
              ...values,
              note: values.note || null,
            }),
          "Alteração aplicada",
          onDone,
        );
        if (ok) onClose();
      }}
    />
  );
}

function MonthDialog({
  item,
  onClose,
  onDone,
}: {
  item: Commitment;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  return (
    <EntityFormDialog
      open
      onOpenChange={(next) => !next && onClose()}
      title={`Valor de ${item.name} em um mês`}
      description="Só aquele mês muda (ex.: parcela de dezembro diferente, salário real do mês). Zero pula o mês."
      schema={monthValueSchema}
      submitLabel="Salvar"
      defaults={{
        month: thisMonth(),
        amount: currentChange(item).amount,
        certainty: "confirmed",
        note: "",
      }}
      fields={[
        { name: "month", label: "Mês (AAAA-MM)", type: "text", required: true },
        {
          name: "amount",
          label: "Valor",
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
        { name: "note", label: "Observação", type: "text" },
      ]}
      onSubmit={async (values) => {
        const ok = await runAction(
          () =>
            planningApi.setMonth(item.id, values.month, {
              amount: values.amount,
              certainty: values.certainty,
              note: values.note || null,
            }),
          "Valor do mês salvo",
          onDone,
        );
        if (ok) onClose();
      }}
    />
  );
}
