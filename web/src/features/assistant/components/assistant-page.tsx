"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, RotateCcw, Sparkles } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { Markdown } from "@/components/shared/markdown";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { answer, type Answer } from "@/features/assistant/lib/answer";
import { apiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { env } from "@/lib/env";
import { useAppData } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

type Message =
  | { id: number; role: "user"; text: string }
  | ({ id: number; role: "assistant" } & Answer);

const suggestions = [
  "What should I focus on today?",
  "What is overdue?",
  "How is TBFernandes Software going?",
  "How are my goals?",
  "How is my money this month?",
  "When can I afford my planned purchases?",
  "Who should I follow up with?",
  "Anything about Kafka?",
];

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
            text: "The assistant could not be reached. Try again in a moment.",
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
        title="Assistant"
        description="Ask about your tasks, projects, goals, money and contacts."
        actions={
          messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setMessages([])}>
              <RotateCcw /> New chat
            </Button>
          )
        }
      />
      <p className="rounded-xl border border-dashed px-4 py-2.5 text-xs text-muted-foreground">
        {env.dataSource === "api"
          ? "Answers come from your data in the API through fixed rules. Once an AI model is connected it writes the text, and the links still point to the records used."
          : "Simulated: answers come from your data through fixed rules. The AI assistant replaces this once the backend exists, and will always show where an answer came from."}
      </p>

      <div
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto"
      >
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-[0_0_40px_-6px_color-mix(in_oklab,var(--primary)_60%,transparent)]">
              <Sparkles className="size-7" aria-hidden />
            </span>
            <p className="text-lg font-medium">How can I help?</p>
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
                {message.references.length > 0 && (
                  <div className="flex flex-col gap-1.5 border-t pt-3">
                    <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                      Sources
                    </span>
                    <ul className="flex flex-wrap gap-1.5">
                      {message.references.map((reference) => (
                        <li key={`${reference.kind}-${reference.label}`}>
                          <Link
                            href={reference.href}
                            className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-0.5 text-xs hover:border-primary hover:text-primary"
                          >
                            <span className="text-muted-foreground">
                              {reference.kind}
                            </span>
                            {reference.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ),
        )}
        {thinking && (
          <div className="flex items-center gap-1 pl-10" aria-label="Thinking">
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
          placeholder="Ask anything about your work and life…"
          aria-label="Message"
          className="max-h-40 min-h-12 resize-none rounded-2xl py-3 pr-14"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send"
          disabled={!draft.trim() || thinking}
          className={cn("absolute right-2 bottom-2 rounded-xl")}
        >
          <ArrowUp />
        </Button>
      </form>
    </PageContainer>
  );
}
