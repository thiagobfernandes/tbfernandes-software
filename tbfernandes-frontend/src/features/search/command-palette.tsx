"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildSearchIndex,
  searchIndex,
  type SearchResult,
} from "@/features/search/search-index";
import { useAppData } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

/** Global search: Ctrl/⌘ K or the header field, across every module. */
export function CommandPalette() {
  const data = useAppData();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const index = useMemo(() => buildSearchIndex(data), [data]);
  const results = query.trim()
    ? searchIndex(index, query)
    : index.filter((item) => item.group === "Páginas");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function choose(result?: SearchResult) {
    if (!result) return;
    setOpen(false);
    router.push(result.href);
  }

  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setActive(0);
    }
  }

  const groups = results.reduce<Map<string, SearchResult[]>>((acc, result) => {
    acc.set(result.group, [...(acc.get(result.group) ?? []), result]);
    return acc;
  }, new Map());
  const optionId = (i: number) => `search-option-${i}`;
  let position = -1;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative hidden h-9 w-full max-w-sm items-center gap-2 rounded-full border border-input bg-muted/50 pr-2 pl-3 text-sm text-muted-foreground outline-none hover:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:flex"
      >
        <Search className="size-4" aria-hidden />
        <span className="flex-1 text-left">Buscar em tudo…</span>
        <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">
          Ctrl K
        </kbd>
      </button>
      <button
        type="button"
        aria-label="Buscar"
        onClick={() => setOpen(true)}
        className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground sm:hidden"
      >
        <Search className="size-4" />
      </button>

      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-[15%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl"
        >
          <DialogTitle className="sr-only">Buscar</DialogTitle>
          <DialogDescription className="sr-only">
            Busque tarefas, projetos, notas, metas, contatos e mais.
          </DialogDescription>
          <div className="flex items-center gap-2 border-b px-4">
            <Search
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <input
              autoFocus
              role="combobox"
              aria-expanded
              aria-controls="search-results"
              aria-activedescendant={
                results.length ? optionId(active) : undefined
              }
              aria-label="Buscar em tudo"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActive((i) => Math.min(i + 1, results.length - 1));
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  choose(results[active]);
                }
              }}
              placeholder="Buscar tarefas, projetos, notas, metas, contatos…"
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div
            id="search-results"
            role="listbox"
            aria-label="Resultados"
            className="max-h-[60svh] overflow-y-auto p-2"
          >
            {results.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Nada encontrado para &ldquo;{query}&rdquo;.
              </p>
            )}
            {[...groups].map(([group, items]) => (
              <div key={group} role="group" aria-label={group} className="mb-2">
                <p className="px-3 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  {group}
                </p>
                {items.map((result) => {
                  position += 1;
                  const i = position;
                  return (
                    <div
                      key={result.id}
                      id={optionId(i)}
                      role="option"
                      aria-selected={i === active}
                      onMouseMove={() => setActive(i)}
                      onClick={() => choose(result)}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2",
                        i === active && "bg-accent",
                      )}
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm">{result.title}</span>
                        {result.subtitle && (
                          <span className="truncate text-xs text-muted-foreground">
                            {result.subtitle}
                          </span>
                        )}
                      </span>
                      {i === active && (
                        <CornerDownLeft
                          className="size-3.5 text-muted-foreground"
                          aria-hidden
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex gap-4 border-t px-4 py-2 text-[11px] text-muted-foreground">
            <span>↑↓ para navegar</span>
            <span>Enter para abrir</span>
            <span>Esc para fechar</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
