"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, BookOpenText, RotateCcw, Sparkles } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { Markdown } from "@/components/shared/markdown";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  answer,
  type Answer,
  type Reference,
} from "@/features/assistant/lib/answer";
import { apiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { env } from "@/lib/env";
import { useAppData } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

type Message =
  | { id: number; role: "user"; text: string }
  | ({ id: number; role: "assistant" } & Answer);

const suggestions = [
  "No que devo focar hoje?",
  "O que está atrasado?",
  "Como está o TBFernandes Software?",
  "Como estão minhas metas?",
  "Como está meu dinheiro neste mês?",
  "Quando consigo fazer minhas compras planejadas?",
  "Com quem devo fazer follow-up?",
  "Tem algo sobre Kafka?",
];

/** Answers built from passages of notes and snippets (AST-04) cite them by number. */
const fromPassages = (source?: string) =>
  source === "rag" || source === "search";

const sourceLabel: Record<string, string> = {
  rag: "Resposta com IA a partir das suas notas",
  search: "Trechos encontrados nas suas notas",
  model: "Texto escrito com IA",
};

export function AssistantPage() {
  const data = useAppData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  function ask(question: string) {
    const text = question.trim();
    if (!text || thinking) return;
    setMessages((current) => [
      ...current,
      { id: nextId.current++, role: "user", text },
    ]);
    setDraft("");
    setThinking(true);
    const reply = (result: Answer) => {
      setMessages((current) => [
        ...current,
        { id: nextId.current++, role: "assistant", ...result },
      ]);
      setThinking(false);
    };
    if (env.dataSource === "api") {
      // Same rules, answered by the API (and by the AI model once one is set).
      const body: components["schemas"]["QuestionRequest"] = { question: text };
      apiFetch<Answer>("/api/v1/assistant/questions", {
        method: "POST",
        body,
      })
        .then(reply)
        .catch(() =>
          reply({
            text: "Não foi possível falar com o assistente. Tente de novo em instantes.",
            references: [],
          }),
        );
      return;
    }
    // A short pause so the exchange reads like the real assistant will.
    setTimeout(() => reply(answer(text, data)), 450);
  }

  return (
    <PageContainer className="h-[calc(100svh-3.5rem)] max-w-3xl gap-4">
      <PageHeading
        title="Assistente"
        description="Pergunte sobre suas tarefas, projetos, metas, dinheiro e contatos."
        actions={
          messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setMessages([])}>
              <RotateCcw /> Nova conversa
            </Button>
          )
        }
      />
      <p className="rounded-xl border border-dashed px-4 py-2.5 text-xs text-muted-foreground">
        {env.dataSource === "api"
          ? "Perguntas sobre tarefas, metas e dinheiro são respondidas com os seus dados. Perguntas abertas buscam nas suas notas e snippets e mostram os trechos usados. Com um modelo de IA conectado, ele escreve a resposta citando cada trecho."
          : "Simulado: as respostas vêm dos seus dados por meio de regras fixas. O assistente com IA substitui isto quando o backend estiver ligado, e sempre vai mostrar de onde veio cada resposta."}
      </p>

      <div
        role="log"
        aria-live="polite"
        aria-label="Conversa"
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto"
      >
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-[0_0_40px_-6px_color-mix(in_oklab,var(--primary)_60%,transparent)]">
              <Sparkles className="size-7" aria-hidden />
            </span>
            <p className="text-lg font-medium">Como posso ajudar?</p>
            <ul className="grid w-full gap-2 sm:grid-cols-2">
              {suggestions.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => ask(suggestion)}
                    className="w-full rounded-xl border bg-card px-3 py-2.5 text-left text-sm outline-none hover:border-primary/60 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {messages.map((message) =>
          message.role === "user" ? (
            <div
              key={message.id}
              className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground"
            >
              {message.text}
            </div>
          ) : (
            <div key={message.id} className="flex max-w-[92%] gap-3">
              <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Sparkles className="size-3.5" aria-hidden />
              </span>
              <div className="flex min-w-0 flex-col gap-3 rounded-2xl rounded-tl-md border bg-card px-4 py-3">
                <Markdown>{message.text}</Markdown>
                {message.references.length > 0 &&
                  (fromPassages(message.source) ? (
                    <PassageSources references={message.references} />
                  ) : (
                    <RecordSources references={message.references} />
                  ))}
                {message.source && sourceLabel[message.source] && (
                  <span className="text-[11px] text-muted-foreground">
                    {sourceLabel[message.source]}
                  </span>
                )}
              </div>
            </div>
          ),
        )}
        {thinking && (
          <div className="flex items-center gap-1 pl-10" aria-label="Pensando">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                style={{ animationDelay: `${dot * 120}ms` }}
              />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          ask(draft);
        }}
        className="relative"
      >
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              ask(draft);
            }
          }}
          rows={1}
          placeholder="Pergunte qualquer coisa sobre seu trabalho e sua vida…"
          aria-label="Mensagem"
          className="max-h-40 min-h-12 resize-none rounded-2xl py-3 pr-14"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Enviar"
          disabled={!draft.trim() || thinking}
          className={cn("absolute right-2 bottom-2 rounded-xl")}
        >
          <ArrowUp />
        </Button>
      </form>
    </PageContainer>
  );
}

function SourcesHeading() {
  return (
    <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
      Fontes
    </span>
  );
}

/** Links to the records an answer was built from. */
function RecordSources({ references }: { references: Reference[] }) {
  return (
    <div className="flex flex-col gap-1.5 border-t pt-3">
      <SourcesHeading />
      <ul className="flex flex-wrap gap-1.5">
        {references.map((reference) => (
          <li key={`${reference.kind}-${reference.label}`}>
            <Link
              href={reference.href}
              className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-0.5 text-xs hover:border-primary hover:text-primary"
            >
              <span className="text-muted-foreground">{reference.kind}</span>
              {reference.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Numbered sources, matching the [n] citations in the text, with the passage each one gave. */
function PassageSources({ references }: { references: Reference[] }) {
  return (
    <div className="flex flex-col gap-2 border-t pt-3">
      <SourcesHeading />
      <ol className="flex flex-col gap-2">
        {references.map((reference, index) => (
          <li key={`${reference.href}-${reference.label}`}>
            <Link
              href={reference.href}
              className="group flex gap-2.5 rounded-xl border bg-background px-3 py-2 outline-none hover:border-primary/60 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/15 text-[11px] font-semibold text-primary tabular-nums">
                {index + 1}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex items-center gap-1.5 text-xs">
                  <BookOpenText
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="text-muted-foreground">
                    {reference.kind}
                  </span>
                  <span className="truncate font-medium group-hover:text-primary">
                    {reference.label}
                  </span>
                </span>
                {reference.excerpt && (
                  <span className="line-clamp-2 text-xs text-muted-foreground">
                    {reference.excerpt}
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
