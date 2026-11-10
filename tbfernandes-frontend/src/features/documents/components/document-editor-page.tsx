"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, FileCode2, FileDown } from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/page-container";
import { DetailSkeleton } from "@/components/shared/detail-skeleton";
import { MissingRecord } from "@/components/shared/missing-record";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  documentActions,
  useDocuments,
} from "@/features/documents/lib/document-store";
import {
  buildStandaloneHtml,
  downloadHtml,
  printHtml,
} from "@/features/documents/lib/export";
import { templateOf } from "@/features/documents/lib/templates";
import { documentHref, DOCUMENTS_PATH } from "@/features/documents/lib/routes";
import type { SavedDocument } from "@/features/documents/types";

import { DocumentFields } from "./document-fields";
import { DocumentPreview } from "./document-preview";

const noop = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

export function DocumentEditorPage({ documentId }: { documentId: string }) {
  const hydrated = useHydrated();
  const documents = useDocuments();
  const router = useRouter();
  const sheetsRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"pdf" | "html" | null>(null);

  const doc = documents.find((d) => d.id === documentId);
  if (!hydrated) return <DetailSkeleton />;
  if (!doc) {
    return (
      <MissingRecord
        noun="este documento"
        backHref={DOCUMENTS_PATH}
        backLabel="Voltar para Edições"
      />
    );
  }

  const template = templateOf(doc.templateId);
  const values = doc.data as unknown as Record<string, unknown>;

  async function exportAs(kind: "pdf" | "html") {
    if (!sheetsRef.current || !doc) return;
    setBusy(kind);
    try {
      const html = await buildStandaloneHtml(sheetsRef.current, doc.name);
      if (kind === "html") {
        downloadHtml(html, doc.name);
        toast.success("HTML baixado.");
      } else {
        await printHtml(html);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível exportar.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title={doc.name}
        description={`${template.name} · salvo automaticamente neste navegador`}
        actions={
          <>
            <Button variant="ghost" asChild>
              <Link href={DOCUMENTS_PATH}>
                <ArrowLeft /> Edições
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const copy = documentActions.duplicate(doc.id);
                if (copy) {
                  toast.success("Cópia criada.");
                  router.push(documentHref(copy.id));
                }
              }}
            >
              <Copy /> Duplicar
            </Button>
            <Button
              variant="outline"
              disabled={busy !== null}
              onClick={() => exportAs("html")}
            >
              <FileCode2 /> Baixar HTML
            </Button>
            <Button disabled={busy !== null} onClick={() => exportAs("pdf")}>
              <FileDown /> {busy === "pdf" ? "Preparando…" : "Gerar PDF"}
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
        <Card className="lg:sticky lg:top-4 lg:max-h-[calc(100svh-2rem)] lg:overflow-y-auto">
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="doc-name">Nome na lista</Label>
              <Input
                id="doc-name"
                value={doc.name}
                onChange={(event) =>
                  documentActions.update(doc.id, { name: event.target.value })
                }
              />
            </div>
            <DocumentFields
              key={doc.id}
              sections={template.sections}
              values={values}
              onChange={(key, value) => {
                const current: SavedDocument = doc;
                const data = {
                  ...current.data,
                  [key]: value,
                } as SavedDocument["data"];
                // Keep the list name in sync until it is renamed by hand.
                const suggested = template.suggestedName as (
                  d: SavedDocument["data"],
                ) => string;
                const followsData = current.name === suggested(current.data);
                documentActions.update(current.id, {
                  data,
                  ...(followsData && { name: suggested(data) }),
                });
              }}
            />
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-2">
          <DocumentPreview doc={doc} sheetsRef={sheetsRef} />
          <p className="text-xs text-muted-foreground">
            “Gerar PDF” abre a impressão: escolha <b>Salvar como PDF</b>, papel
            A4 e margens “Nenhuma”, com gráficos de fundo ativados.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
