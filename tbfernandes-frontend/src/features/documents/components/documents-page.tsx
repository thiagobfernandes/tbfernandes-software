"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy,
  FilePenLine,
  Plus,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/page-container";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  documentActions,
  useDocuments,
} from "@/features/documents/lib/document-store";
import { documentHref } from "@/features/documents/lib/routes";
import { TEMPLATE_LIST, templateOf } from "@/features/documents/lib/templates";
import type { DocumentTemplateId } from "@/features/documents/types";

const TEMPLATE_ICON: Record<DocumentTemplateId, LucideIcon> = {
  proposal: FilePenLine,
  letter: ScrollText,
};

const updatedLabel = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function DocumentsPage() {
  const documents = useDocuments();
  const router = useRouter();

  function create(templateId: DocumentTemplateId) {
    const doc = documentActions.create(templateId);
    router.push(documentHref(doc.id));
  }

  return (
    <PageContainer>
      <PageHeading
        title="Edições"
        description="Propostas e documentos da TB Fernandes Softwares em um modelo padrão: preencha, confira a prévia e gere o PDF."
      />

      <section className="grid gap-4 sm:grid-cols-2">
        {TEMPLATE_LIST.map((template) => {
          const Icon = TEMPLATE_ICON[template.id];
          return (
            <Card key={template.id} className="gap-0">
              <CardContent className="flex h-full flex-col gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="flex flex-col gap-1">
                    <h2 className="font-semibold">{template.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <Badge variant="secondary">{template.pages}</Badge>
                  <Button onClick={() => create(template.id)}>
                    <Plus /> Novo
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
          Documentos salvos
        </h2>
        {documents.length === 0 ? (
          <EmptyState
            icon={FilePenLine}
            title="Nenhum documento ainda"
            description="Comece por uma proposta comercial: ela já vem com os seus dados, a paleta da marca e o texto padrão."
            action={
              <Button onClick={() => create("proposal")}>
                <Plus /> Nova proposta
              </Button>
            }
          />
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {documents.map((doc) => {
              const template = templateOf(doc.templateId);
              const Icon = TEMPLATE_ICON[doc.templateId];
              return (
                <li key={doc.id} className="flex items-center gap-3 px-4 py-3">
                  <Icon className="size-4 shrink-0 text-primary" aria-hidden />
                  <Link
                    href={documentHref(doc.id)}
                    className="flex min-w-0 flex-1 flex-col hover:underline"
                  >
                    <span className="truncate text-sm font-medium">
                      {doc.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {template.name} · editado em{" "}
                      {updatedLabel.format(new Date(doc.updatedAt))}
                    </span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Duplicar documento"
                    className="text-muted-foreground"
                    onClick={() => {
                      documentActions.duplicate(doc.id);
                      toast.success("Cópia criada.");
                    }}
                  >
                    <Copy />
                  </Button>
                  <ConfirmDelete
                    noun="documento"
                    name={doc.name}
                    consequence="Arquivos PDF e HTML já baixados continuam no seu computador."
                    onConfirm={() => {
                      documentActions.remove(doc.id);
                      toast.success("Documento excluído.");
                    }}
                  />
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          Os documentos ficam salvos neste navegador. Guarde o PDF ou o HTML
          exportado como cópia definitiva.
        </p>
      </section>
    </PageContainer>
  );
}
