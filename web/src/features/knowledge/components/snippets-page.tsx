"use client";

import { useState } from "react";
import { Code2, ExternalLink, Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/page-container";
import { CodeBlock } from "@/components/shared/code-block";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SnippetFormDialog } from "@/features/knowledge/components/knowledge-form-dialogs";
import {
  KnowledgeLinkChips,
  TagFilter,
  TagList,
  uniqueTags,
} from "@/features/knowledge/components/knowledge-links";
import { matchesQuery } from "@/features/knowledge/lib/link-options";
import type { Snippet } from "@/features/knowledge/types/knowledge";
import { dataActions, useAppData } from "@/lib/sample-data/store";

const ALL = "all";

export function SnippetsPage() {
  const { snippets } = useAppData();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string>();
  const [language, setLanguage] = useState(ALL);
  const [editing, setEditing] = useState<Snippet>();

  const languages = [
    ...new Set(snippets.map((snippet) => snippet.language)),
  ].sort();
  const visible = snippets
    .filter((snippet) => language === ALL || snippet.language === language)
    .filter((snippet) => (tag ? snippet.tags.includes(tag) : true))
    .filter((snippet) =>
      matchesQuery(query, snippet, snippet.code, snippet.explanation),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Snippets"
        description="Reusable code with an explanation of when to use it."
        actions={
          <>
            <SampleDataBadge />
            <SnippetFormDialog
              trigger={
                <Button>
                  <Plus /> New snippet
                </Button>
              }
            />
          </>
        }
      />

      {snippets.length === 0 ? (
        <EmptyState
          icon={Code2}
          title="No snippets yet"
          description="Save commands, queries and patterns you look up more than once."
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative flex-1 sm:max-w-sm">
                <span className="sr-only">Search snippets</span>
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search title, code or tag"
                  className="pl-9"
                />
              </label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="sm:w-44" aria-label="Language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All languages</SelectItem>
                  {languages.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <TagFilter
              tags={uniqueTags(snippets)}
              active={tag}
              onChange={setTag}
            />
          </div>

          {visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              No snippets match these filters.
            </p>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {visible.map((snippet) => (
                <article
                  key={snippet.id}
                  className="flex min-w-0 flex-col gap-3 rounded-2xl border bg-card p-4"
                >
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <h2 className="text-sm font-medium">{snippet.title}</h2>
                      {snippet.explanation && (
                        <p className="text-xs text-muted-foreground">
                          {snippet.explanation}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0">
                      {snippet.sourceUrl && (
                        <Button variant="ghost" size="icon-sm" asChild>
                          <a
                            href={snippet.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Open source"
                          >
                            <ExternalLink />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Edit snippet"
                        onClick={() => setEditing(snippet)}
                      >
                        <Pencil />
                      </Button>
                      <ConfirmDelete
                        noun="snippet"
                        name={snippet.title}
                        onConfirm={() => {
                          dataActions.remove("snippets", snippet.id);
                          toast.success("Snippet deleted");
                        }}
                      />
                    </div>
                  </header>
                  <CodeBlock
                    code={snippet.code}
                    language={snippet.language}
                    maxLines={12}
                  />
                  <TagList tags={snippet.tags} />
                  <KnowledgeLinkChips links={snippet} />
                </article>
              ))}
            </div>
          )}
        </>
      )}
      <SnippetFormDialog
        item={editing}
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(undefined)}
      />
    </PageContainer>
  );
}
