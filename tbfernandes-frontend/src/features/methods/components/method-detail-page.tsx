"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck, ChevronLeft, Pencil, SearchX } from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/page-container";
import { CodeBlock } from "@/components/shared/code-block";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { methodCategoryMeta } from "@/features/methods/components/method-category";
import { MethodChecklist } from "@/features/methods/components/method-checklist";
import { formatShort } from "@/lib/dates";
import { MethodFormDialog } from "@/features/methods/components/method-form-dialog";
import { UseMethodDialog } from "@/features/methods/components/use-method-dialog";
import { dataActions, useAppData } from "@/lib/sample-data/store";

export function MethodDetailPage({ methodId }: { methodId: string }) {
  const { methods } = useAppData();
  const router = useRouter();
  const method = methods.find((item) => item.id === methodId);
  if (!method) return <MissingMethod />;

  const { label, icon: Icon } = methodCategoryMeta[method.category];

  return (
    <PageContainer>
      <Link
        href="/methods"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden /> Métodos
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-primary">
            <Icon className="size-6" aria-hidden />
          </span>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">
              {method.title}
            </h1>
            <p className="text-sm text-muted-foreground">{method.summary}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium">
                {label}
              </span>
              {method.tags.map((tag) => (
                <span key={tag} className="rounded-md border px-1.5 py-0.5">
                  #{tag}
                </span>
              ))}
              <span className="flex items-center gap-1">
                <CalendarCheck className="size-3.5" aria-hidden />
                Revisado em {formatShort(method.lastReviewed)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <MethodFormDialog
            method={method}
            trigger={
              <Button variant="outline">
                <Pencil /> Editar
              </Button>
            }
          />
          <ConfirmDelete
            noun="método"
            name={method.title}
            onConfirm={() => {
              dataActions.remove("methods", method.id);
              toast.success("Método excluído");
              router.push("/methods");
            }}
          />
          <UseMethodDialog method={method} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-label="Passos" className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Passos</h2>
          <MethodChecklist steps={method.steps} />
        </section>

        {method.examples?.length ? (
          <aside className="flex flex-col gap-4">
            {method.examples.map((example) => (
              <Card key={example.title} className="gap-3 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">{example.title}</CardTitle>
                  <CardDescription>Copie e adapte.</CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock code={example.content} language="plaintext" />
                </CardContent>
              </Card>
            ))}
          </aside>
        ) : null}
      </div>
    </PageContainer>
  );
}

function MissingMethod() {
  return (
    <PageContainer>
      <EmptyState
        icon={SearchX}
        title="Método não encontrado"
        description="O registro pode ter sido removido ou o link está errado."
        action={
          <Button variant="outline" asChild>
            <Link href="/methods">Voltar para métodos</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
