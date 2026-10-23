"use client";

import { useMemo, useState } from "react";
import hljs from "highlight.js/lib/common";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CodeBlockProps = {
  code: string;
  language: string;
  className?: string;
  /** Limits the visible height; the block scrolls beyond it. */
  maxLines?: number;
};

/** Syntax-highlighted, copyable code. The code is only displayed, never run. */
export function CodeBlock({
  code,
  language,
  className,
  maxLines,
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

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy. Select the code and copy it manually.");
    }
  }

  return (
    <div
      className={cn(
        "group/code relative overflow-hidden rounded-xl border bg-muted/40",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <span className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          {language}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-7"
          onClick={copy}
          aria-label="Copy code"
        >
          {copied ? <Check className="text-success" /> : <Copy />}
        </Button>
      </div>
      <pre
        className="hljs overflow-auto p-4 font-mono text-xs leading-relaxed"
        style={
          maxLines ? { maxHeight: `${maxLines * 1.625 + 2}rem` } : undefined
        }
      >
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
