"use client";

import { useMemo, useState } from "react";
import hljs from "highlight.js/lib/common";
import { Check, Copy, Maximize2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type CodeBlockProps = {
  code: string;
  language: string;
  className?: string;
  /** Limits the visible height; the block scrolls beyond it. */
  maxLines?: number;
  /** Shows a "Abrir snippet completo" button in the header. */
  onExpand?: () => void;
  /** Wraps long lines instead of scrolling sideways. */
  wrap?: boolean;
  /** Grows to the height of its parent (e.g. a modal body). */
  fill?: boolean;
  /** Line numbers in the gutter. */
  lineNumbers?: boolean;
};

/** Syntax-highlighted, copyable code. The code is only displayed, never run. */
export function CodeBlock({
  code,
  language,
  className,
  maxLines,
  onExpand,
  wrap = false,
  fill = false,
  lineNumbers = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  // highlight.js escapes the source, so the generated markup is safe to inject.
  const html = useMemo(
    () =>
      hljs.getLanguage(language)
        ? hljs.highlight(code, { language }).value
        : hljs.highlightAuto(code).value,
    [code, language],
  );
  const lines = useMemo(() => code.split("\n").length, [code]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Copiado para a área de transferência");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(
        "Não foi possível copiar. Selecione o código e copie manualmente.",
      );
    }
  }

  return (
    <div
      className={cn(
        "group/code relative flex flex-col overflow-hidden rounded-xl border bg-muted/40",
        fill && "min-h-0 flex-1",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-1.5">
        <span className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          {language}
          {maxLines && lines > maxLines && (
            <span className="ml-2 tracking-normal normal-case">
              · {lines} linhas
            </span>
          )}
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7"
            onClick={copy}
            aria-label="Copiar código"
          >
            {copied ? <Check className="text-success" /> : <Copy />}
          </Button>
          {onExpand && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 text-muted-foreground hover:text-primary"
                  onClick={onExpand}
                  aria-label="Abrir snippet completo"
                >
                  <Maximize2 />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Abrir snippet completo</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      <div
        className={cn("flex overflow-auto", fill && "min-h-0 flex-1")}
        style={
          maxLines ? { maxHeight: `${maxLines * 1.625 + 2}rem` } : undefined
        }
      >
        {lineNumbers && (
          <pre
            aria-hidden
            className="sticky left-0 shrink-0 border-r bg-muted/60 py-4 pr-3 pl-4 text-right font-mono text-xs leading-relaxed text-muted-foreground/60 select-none"
          >
            {Array.from({ length: lines }, (_, index) => index + 1).join("\n")}
          </pre>
        )}
        <pre
          className={cn(
            "hljs min-w-0 flex-1 p-4 font-mono text-xs leading-relaxed",
            wrap ? "break-words whitespace-pre-wrap" : "whitespace-pre",
          )}
        >
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      </div>
    </div>
  );
}
