import { Plus, Workflow } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";

export function MethodsPage() {
  return (
    <PageContainer>
      <PageHeading
        title="Methods"
        description="Reusable workflows and checklists, such as committing, fixing bugs, and running meetings."
        actions={
          <Button disabled>
            <Plus /> New method
          </Button>
        }
      />
      <EmptyState
        icon={Workflow}
        title="No methods yet"
        description="The commit, bug-fixing, and meeting methods will be the first entries in this library."
      />
    </PageContainer>
  );
}
