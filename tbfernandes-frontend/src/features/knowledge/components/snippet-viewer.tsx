"use client";

import { useState } from "react";
import {
  ExternalLink,
  Maximize,
  Minimize,
  Pencil,
  WrapText,
  X,
} from "lucide-react";

import { CodeBlock } from "@/components/shared/code-block";
import { Markdown } from "@/components/shared/markdown";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFullscreen } from "@/components/workspace/use-fullscreen";
import {
  KnowledgeLinkChips,
  TagList,
} from "@/features/knowledge/components/knowledge-links";
import type { Snippet } from "@/features/knowledge/types/knowledge";
import { formatShort } from "@/lib/dates";
import { usePreference } from "@/lib/preferences";
import { cn } from "@/lib/utils";

function IconAction({
  label,
  onClick,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          aria-pressed={pressed}
          onClick={onClick}
          className={cn(
            "text-muted-foreground hover:text-foreground",
            pressed && "bg-primary/10 text-primary hover:text-primary",
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * The whole snippet in a large modal: full code (no height limit), the
 * explanation in Markdown beside it, tags and links. The Dialog already
 * locks the page scroll, closes on Esc or outside click and gives the focus
 * (and the scroll position) back to the page when it closes.
 */
export function SnippetViewer({
  snippet,
  onOpenChange,
  onEdit,
}: {
  snippet?: Snippet;
  onOpenChange: (open: boolean) => void;
  onEdit: (snippet: Snippet) => void;
}) {
  const [wrap, setWrap] = usePreference("snippets:wrap", false);
  const [expanded, setExpanded] = useState(false);
  const fullscreen = useFullscreen();

  const close = (open: boolean) => {
    if (open) return;
    if (fullscreen.active) void fullscreen.toggle();
    setExpanded(false);
    onOpenChange(false);
  };
  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    // Real fullscreen too, when the browser allows it.
    if (fullscreen.supported && next !== fullscreen.active)
      void fullscreen.toggle();
  };

  return (
    <Dialog open={Boolean(snippet)} onOpenChange={close}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex flex-col gap-0 overflow-hidden p-0 sm:max-w-none",
          expanded
            ? "h-svh max-h-svh w-screen max-w-none rounded-none border-0"
            : "max-h-[90svh] w-[min(90vw,80rem)] max-w-[calc(100%-1.5rem)]",
        )}
      >
        {snippet && (
          <>
            <header className="flex shrink-0 items-start gap-3 border-b px-5 py-3.5">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <DialogTitle className="text-base leading-snug font-semibold">
                  {snippet.title}
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-px font-mono text-[11px] tracking-wide text-primary uppercase">
                    {snippet.language}
                  </span>
                  <span>
                    {snippet.code.split("\n").length} linhas · atualizado em{" "}
                    {formatShort(snippet.updatedAt.slice(0, 10))}
                  </span>
                </DialogDescription>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                {snippet.sourceUrl && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        asChild
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <a
                          href={snippet.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Abrir origem"
                        >
                          <ExternalLink />
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Abrir origem</TooltipContent>
                  </Tooltip>
                )}
                <IconAction
                  label={wrap ? "Não quebrar linhas" : "Quebrar linhas longas"}
                  pressed={wrap}
                  onClick={() => setWrap(!wrap)}
                >
                  <WrapText />
                </IconAction>
                <IconAction
                  label={expanded ? "Sair da tela cheia" : "Tela cheia"}
                  pressed={expanded}
                  onClick={toggleExpanded}
                >
                  {expanded ? <Minimize /> : <Maximize />}
                </IconAction>
                <IconAction
                  label="Editar snippet"
                  onClick={() => onEdit(snippet)}
                >
                  <Pencil />
                </IconAction>
                <span aria-hidden className="mx-1 h-4 w-px bg-border" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogClose asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Fechar"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X />
                      </Button>
                    </DialogClose>
                  </TooltipTrigger>
                  <TooltipContent>Fechar (Esc)</TooltipContent>
                </Tooltip>
              </div>
            </header>

            <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_22rem] lg:overflow-hidden">
              <div className="flex min-h-0 min-w-0 flex-col p-4 lg:overflow-hidden">
                <CodeBlock
                  code={snippet.code}
                  language={snippet.language}
                  wrap={wrap}
                  lineNumbers={!wrap}
                  fill
                  className="lg:min-h-0"
                />
              </div>
              <aside className="flex min-w-0 flex-col gap-5 border-t px-5 py-4 lg:overflow-y-auto lg:border-t-0 lg:border-l">
                {snippet.explanation ? (
                  <section className="flex flex-col gap-2">
                    <h3 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                      Explicação
                    </h3>
                    <Markdown className="text-sm">
                      {snippet.explanation}
                    </Markdown>
                  </section>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Sem explicação. Use “Editar” para dizer quando usar este
                    código.
                  </p>
                )}
                {snippet.tags.length > 0 && (
                  <section className="flex flex-col gap-2">
                    <h3 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                      Tags
                    </h3>
                    <TagList tags={snippet.tags} />
                  </section>
                )}
                <section className="flex flex-col gap-2">
                  <h3 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Vínculos
                  </h3>
                  <KnowledgeLinkChips links={snippet} />
                </section>
              </aside>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
