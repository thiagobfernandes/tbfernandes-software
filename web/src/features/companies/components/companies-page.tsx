import { Building2, Plus } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";

export function CompaniesPage() {
  return (
    <PageContainer>
      <PageHeading
        title="Companies"
        description="Organizations you work for, serve, or partner with."
        actions={
          <Button disabled>
            <Plus /> New company
          </Button>
        }
      />
      <EmptyState
        icon={Building2}
        title="No companies yet"
        description="Companies give context to projects and tasks. Registering them arrives with the Companies feature."
      />
    </PageContainer>
  );
}
