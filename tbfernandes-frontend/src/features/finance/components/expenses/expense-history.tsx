"use client";

import { useState } from "react";
import { Search } from "lucide-react";

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
import {
  expenseSourceLabels,
  expenseStatusLabels,
  formatMoney,
  formatMonthShort,
} from "@/features/finance/lib/planning-format";
import type {
  ExpenseItem,
  ExpenseStatus,
} from "@/features/finance/types/planning";
import { formatShort } from "@/lib/dates";
import { cn } from "@/lib/utils";

import { LineDelete } from "../planning/line-delete";
import { categoryOf, ExpenseStatusBadge, sumOf } from "./expense-ui";

type SortKey = "due" | "amount" | "name";
type SourceFilter = ExpenseItem["source"] | "all";
type StatusFilter = ExpenseStatus | "all";

const sorters: Record<SortKey, (a: ExpenseItem, b: ExpenseItem) => number> = {
  due: (first, second) =>
    (first.dueDate ?? "9999").localeCompare(second.dueDate ?? "9999"),
  amount: (first, second) => second.amount - first.amount,
  name: (first, second) => first.name.localeCompare(second.name, "pt-BR"),
};

function filtered(
  items: ExpenseItem[],
  query: string,
  source: SourceFilter,
  status: StatusFilter,
) {
  const needle = query.trim().toLowerCase();
  return items.filter(
    (item) =>
      (source === "all" || item.source === source) &&
      (status === "all" || item.status === status) &&
      (!needle ||
        item.name.toLowerCase().includes(needle) ||
        categoryOf(item).toLowerCase().includes(needle)),
  );
}

/** Every expense of the month, one per line, with search, filters, order and delete. */
export function ExpenseHistory({
  items,
  month,
  closed,
  onChanged,
}: {
  items: ExpenseItem[];
  month: string;
  closed: boolean;
  onChanged: () => Promise<void> | void;
}) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<SourceFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("due");
  const listed = filtered(items, query, source, status).sort(sorters[sort]);
  const counted = listed.filter((item) => item.counted);

  return (
    <Card className="rounded-lg">
      <CardHeader className="flex flex-col gap-3">
        <div>
          <CardTitle>Todos os gastos</CardTitle>
          <CardDescription>
            {listed.length} itens · {formatMoney(sumOf(counted))} contados
          </CardDescription>
        </div>
        <HistoryFilters
          query={query}
          onQuery={setQuery}
          source={source}
          onSource={setSource}
          status={status}
          onStatus={setStatus}
          sort={sort}
          onSort={setSort}
        />
      </CardHeader>
      <CardContent>
        {listed.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum gasto com esses filtros.
          </p>
        ) : (
          <ul className="flex flex-col">
            {listed.map((item) => (
              <HistoryRow
                key={item.key}
                item={item}
                month={month}
                closed={closed}
                onChanged={onChanged}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function HistoryFilters(props: {
  query: string;
  onQuery: (value: string) => void;
  source: SourceFilter;
  onSource: (value: SourceFilter) => void;
  status: StatusFilter;
  onStatus: (value: StatusFilter) => void;
  sort: SortKey;
  onSort: (value: SortKey) => void;
}) {
  return (
    <div className="grid w-full gap-2 sm:grid-cols-2 2xl:grid-cols-4">
      <div className="relative sm:col-span-2 2xl:col-span-1">
        <Search
          className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={props.query}
          onChange={(event) => props.onQuery(event.target.value)}
          placeholder="Buscar gasto"
          aria-label="Buscar gasto"
          className="pl-8"
        />
      </div>
      <Pick
        label="Origem"
        value={props.source}
        onChange={props.onSource}
        options={{ all: "Todas as origens", ...expenseSourceLabels }}
      />
      <Pick
        label="Situação"
        value={props.status}
        onChange={props.onStatus}
        options={{ all: "Todas as situações", ...expenseStatusLabels }}
      />
      <Pick
        label="Ordenar"
        value={props.sort}
        onChange={props.onSort}
        options={{ due: "Por vencimento", amount: "Maior valor", name: "Nome" }}
      />
    </div>
  );
}

function Pick<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Record<T, string>;
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as T)}>
      <SelectTrigger aria-label={label} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(options) as [T, string][]).map(([key, text]) => (
          <SelectItem key={key} value={key}>
            {text}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function HistoryRow({
  item,
  month,
  closed,
  onChanged,
}: {
  item: ExpenseItem;
  month: string;
  closed: boolean;
  onChanged: () => Promise<void> | void;
}) {
  const details = [
    categoryOf(item),
    expenseSourceLabels[item.source],
    `competência ${formatMonthShort(item.competence)}`,
    item.dueDate ? `vence ${formatShort(item.dueDate)}` : null,
    item.installment
      ? `parcela ${item.installment.number}/${item.installment.total ?? "?"}`
      : null,
    item.scope === "business" ? "empresa" : null,
  ].filter(Boolean);
  return (
    <li
      className={cn(
        "flex items-center gap-3 border-b border-border/60 py-2.5 last:border-0",
        !item.counted && "opacity-60",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {details.join(" · ")}
        </p>
        {item.excludedReason && (
          <p className="text-xs text-muted-foreground italic">
            Não somado: {item.excludedReason}
          </p>
        )}
      </div>
      <ExpenseStatusBadge status={item.status} />
      <span className="w-24 text-right text-sm font-medium tabular-nums sm:w-28">
        {formatMoney(item.amount)}
      </span>
      <LineDelete
        line={{ ...item, hasStatement: item.payable }}
        month={month}
        closed={closed}
        onDone={onChanged}
      />
    </li>
  );
}
