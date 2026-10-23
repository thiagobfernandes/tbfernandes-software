"use client";

import Link from "next/link";
import { ListOrdered, Plus } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { methodCategoryMeta } from "@/features/methods/components/method-category";
import { formatShort } from "@/lib/dates";
import { MethodFormDialog } from "@/features/methods/components/method-form-dialog";
import { useAppData } from "@/lib/sample-data/store";

export function MethodsPage() {
  const { methods } = useAppData();
  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Methods"
        description="Reusable workflows and checklists you can follow step by step."
        actions={
          <MethodFormDialog
            trigger={
              <Button>
                <Plus /> New method
              </Button>
            }
          />
        }
      />

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {methods.map((method) => {
          const { label, icon: Icon } = methodCategoryMeta[method.category];
          return (
            <Link
              key={method.id}
              href={`/methods/${method.id}`}
              className="group flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-colors outline-none hover:border-input focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {label}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="font-medium group-hover:text-primary">
                  {method.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {method.summary}
                </p>
              </div>
              <ol className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                {method.steps.slice(0, 3).map((step, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="w-4 shrink-0 text-right tabular-nums">
                      {index + 1}.
                    </span>
                    <span className="truncate">{step.title}</span>
                  </li>
                ))}
                {method.steps.length > 3 && (
                  <li className="pl-6">+{method.steps.length - 3} more</li>
                )}
              </ol>
              <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ListOrdered className="size-3.5" aria-hidden />
                  {method.steps.length} steps
                </span>
                <span>Reviewed {formatShort(method.lastReviewed)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </PageContainer>
  );
}
