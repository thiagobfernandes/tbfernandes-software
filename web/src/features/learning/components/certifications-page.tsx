"use client";

import { useState } from "react";
import { AlertTriangle, ExternalLink, Medal, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/page-container";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import { CertificationFormDialog } from "@/features/learning/components/learning-form-dialogs";
import { certificationStatusLabels } from "@/features/learning/components/learning-meta";
import type {
  Certification,
  CertificationStatus,
} from "@/features/learning/types/learning";
import { daysBetween, formatShort } from "@/lib/dates";
import { dataActions, useAppData } from "@/lib/sample-data/store";
import { SAMPLE_TODAY } from "@/lib/sample-data/work";
import { cn } from "@/lib/utils";

const columns: CertificationStatus[] = [
  "planned",
  "studying",
  "obtained",
  "expired",
];

const statusTone: Record<CertificationStatus, string> = {
  planned: "bg-muted-foreground/50",
  studying: "bg-warning",
  obtained: "bg-success",
  expired: "bg-destructive",
};

/** Obtained certifications expiring within 90 days need a renewal plan. */
function expiresSoon(certification: Certification) {
  return (
    certification.status === "obtained" &&
    certification.expiresAt !== undefined &&
    daysBetween(SAMPLE_TODAY, certification.expiresAt) <= 90
  );
}

export function CertificationsPage() {
  const { certifications, studies } = useAppData();
  const [editing, setEditing] = useState<Certification>();

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Certifications"
        description="Planned, in-progress and obtained certifications, with expiry reminders."
        actions={
          <>
            <SampleDataBadge />
            <CertificationFormDialog
              trigger={
                <Button>
                  <Plus /> New certification
                </Button>
              }
            />
          </>
        }
      />

      {certifications.length === 0 ? (
        <EmptyState icon={Medal} title="No certifications yet" />
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 md:-mx-6 md:px-6">
          <div className="grid auto-cols-[18rem] grid-flow-col gap-4 xl:auto-cols-fr">
            {columns.map((status) => {
              const items = certifications.filter(
                (item) => item.status === status,
              );
              return (
                <section
                  key={status}
                  aria-label={certificationStatusLabels[status]}
                  className="flex flex-col gap-3 rounded-2xl bg-muted/40 p-2.5"
                >
                  <header className="flex items-center gap-2 px-1.5 pt-1">
                    <span
                      aria-hidden
                      className={cn("size-2 rounded-full", statusTone[status])}
                    />
                    <h2 className="text-sm font-medium">
                      {certificationStatusLabels[status]}
                    </h2>
                    <span className="ml-auto rounded-full bg-background px-2 py-px text-xs text-muted-foreground tabular-nums">
                      {items.length}
                    </span>
                  </header>
                  {items.length === 0 && (
                    <p className="rounded-xl border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                      None
                    </p>
                  )}
                  {items.map((certification) => {
                    const related = studies.filter((study) =>
                      certification.studyIds.includes(study.id),
                    );
                    return (
                      <article
                        key={certification.id}
                        className="flex flex-col gap-3 rounded-xl border bg-card p-3.5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <h3 className="text-sm leading-snug font-medium">
                              {certification.name}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              {certification.issuer}
                            </span>
                          </div>
                          <Medal
                            className="size-5 shrink-0 text-primary"
                            aria-hidden
                          />
                        </div>
                        {expiresSoon(certification) && (
                          <p className="flex items-center gap-1.5 rounded-lg bg-warning/15 px-2 py-1 text-xs text-warning">
                            <AlertTriangle className="size-3.5" aria-hidden />
                            Expires {formatShort(certification.expiresAt!)}:
                            plan the renewal
                          </p>
                        )}
                        <dl className="grid grid-cols-2 gap-2 text-xs">
                          {certification.obtainedAt && (
                            <div>
                              <dt className="text-muted-foreground">
                                Obtained
                              </dt>
                              <dd>
                                {formatShort(certification.obtainedAt)}{" "}
                                {certification.obtainedAt.slice(0, 4)}
                              </dd>
                            </div>
                          )}
                          {certification.expiresAt && (
                            <div>
                              <dt className="text-muted-foreground">Expires</dt>
                              <dd>
                                {formatShort(certification.expiresAt)}{" "}
                                {certification.expiresAt.slice(0, 4)}
                              </dd>
                            </div>
                          )}
                        </dl>
                        {related.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Study:{" "}
                            {related.map((study) => study.name).join(", ")}
                          </p>
                        )}
                        <div className="flex items-center gap-1 border-t pt-2">
                          {certification.validationUrl && (
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={certification.validationUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink /> Validate
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="ml-auto"
                            aria-label="Edit certification"
                            onClick={() => setEditing(certification)}
                          >
                            <Pencil />
                          </Button>
                          <ConfirmDelete
                            noun="certification"
                            name={certification.name}
                            onConfirm={() => {
                              dataActions.remove(
                                "certifications",
                                certification.id,
                              );
                              toast.success("Certification deleted");
                            }}
                          />
                        </div>
                      </article>
                    );
                  })}
                </section>
              );
            })}
          </div>
        </div>
      )}
      <CertificationFormDialog
        item={editing}
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(undefined)}
      />
    </PageContainer>
  );
}
