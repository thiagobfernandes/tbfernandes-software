"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/features/prospecting/components/status-badge";
import {
  classificationLabel,
  relativeTime,
  statusMeta,
  statusOrder,
} from "@/features/prospecting/lib/prospecting";
import type {
  LeadStatus,
  ProspectLead,
} from "@/features/prospecting/types/prospecting";
import { cn } from "@/lib/utils";

export const ALL = "all";
export const WAITING = "waiting";
export type LeadFilter = LeadStatus | typeof ALL | typeof WAITING;

const PAGE_SIZE = 10;

function initials(name: string) {
  return name
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/** The leads as a bordered panel: search and filter on top, ten per page below. */
export function LeadList({
  leads,
  total,
  waiting,
  selectedId,
  now,
  query,
  onQuery,
  filter,
  onFilter,
  onSelect,
}: {
  leads: ProspectLead[];
  total: number;
  waiting: Set<string>;
  selectedId?: string;
  now: Date;
  query: string;
  onQuery: (value: string) => void;
  filter: LeadFilter;
  onFilter: (value: LeadFilter) => void;
  onSelect: (id: string) => void;
}) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(leads.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const shown = leads.slice(
    current * PAGE_SIZE,
    current * PAGE_SIZE + PAGE_SIZE,
  );
  const from = leads.length ? current * PAGE_SIZE + 1 : 0;
  const to = current * PAGE_SIZE + shown.length;

  return (
    <section
      aria-label="Leads"
      className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card xl:h-full"
    >
      <div className="flex flex-col gap-2 border-b p-3">
        <label className="relative">
          <span className="sr-only">Buscar leads</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => {
              onQuery(event.target.value);
              setPage(0);
            }}
            placeholder="Buscar por nome, cidade ou número"
            className="pl-9"
          />
        </label>
        <Select
          value={filter}
          onValueChange={(value) => {
            onFilter(value as LeadFilter);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-full" aria-label="Filtrar por status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os leads</SelectItem>
            <SelectItem value={WAITING}>Aguardando você</SelectItem>
            {statusOrder.map((value) => (
              <SelectItem key={value} value={value}>
                {statusMeta[value].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ul className="flex flex-col divide-y xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
        {shown.map((lead) => {
          const selected = lead.id === selectedId;
          const last = relativeTime(lead.lastMessageAt, now);
          return (
            <li key={lead.id}>
              <button
                type="button"
                aria-current={selected ? "true" : undefined}
                onClick={() => onSelect(lead.id)}
                className={cn(
                  "group flex w-full items-start gap-3 px-3 py-3 text-left transition-colors duration-150 outline-none hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  selected && "bg-accent hover:bg-accent",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground transition-colors",
                    selected && "bg-primary text-primary-foreground",
                  )}
                >
                  {initials(lead.name)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {lead.name}
                    </span>
                    {last && (
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {last}
                      </span>
                    )}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    {lead.city && <span>{lead.city}</span>}
                    {lead.classification && (
                      <span
                        className={cn(
                          lead.classification === "hot" && "text-primary",
                        )}
                      >
                        {classificationLabel[lead.classification]}
                      </span>
                    )}
                    {waiting.has(lead.id) ? (
                      <span className="rounded-md border border-primary/50 bg-primary/10 px-1.5 py-px text-primary">
                        Aguardando você
                      </span>
                    ) : (
                      <StatusBadge status={lead.status} />
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        {shown.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhum lead com esse filtro.
          </li>
        )}
      </ul>

      <footer className="mt-auto flex items-center justify-between gap-2 border-t px-3 py-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          {from}–{to} de {leads.length}
          {leads.length !== total && ` (${total} no total)`}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-11 sm:size-8"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-12 text-center text-xs text-muted-foreground tabular-nums">
            {current + 1} / {pages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-11 sm:size-8"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
            aria-label="Próxima página"
          >
            <ChevronRight />
          </Button>
        </div>
      </footer>
    </section>
  );
}
