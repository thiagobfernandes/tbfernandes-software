"use client";

import { Plus } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeading } from "@/components/shared/page-heading";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import { CompanyCard } from "@/features/companies/components/company-card";
import { CompanyFormDialog } from "@/features/companies/components/company-form-dialog";
import type { Company } from "@/features/projects/types/project";
import { selectors, useWorkData } from "@/lib/sample-data/store";

export function CompaniesPage() {
  const data = useWorkData();
  const active = data.companies.filter(
    (company) => company.status !== "closed",
  );
  const closed = data.companies.filter(
    (company) => company.status === "closed",
  );

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Empresas"
        description="Organizações para as quais você trabalha, atende ou com quem tem parceria."
        actions={
          <>
            <SampleDataBadge />
            <CompanyFormDialog
              trigger={
                <Button>
                  <Plus /> Nova empresa
                </Button>
              }
            />
          </>
        }
      />

      <CompanyGrid title="Ativas" companies={active} />
      {closed.length > 0 && (
        <CompanyGrid title="Anteriores" companies={closed} />
      )}
    </PageContainer>
  );
}

function CompanyGrid({
  title,
  companies,
}: {
  title: string;
  companies: Company[];
}) {
  const data = useWorkData();
  const { projectsOfCompany } = selectors(data);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">
        {title} <span className="tabular-nums">({companies.length})</span>
      </h2>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {companies.map((company) => {
          const projects = projectsOfCompany(company.id);
          const projectIds = new Set(projects.map((project) => project.id));
          return (
            <CompanyCard
              key={company.id}
              company={company}
              projects={projects}
              tasks={data.tasks.filter(
                (task) => task.projectId && projectIds.has(task.projectId),
              )}
            />
          );
        })}
      </div>
    </section>
  );
}
