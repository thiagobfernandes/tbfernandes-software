import { ListChecks, Plus } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";

export function TasksPage() {
  return (
    <PageContainer>
      <PageHeading
        title="Tasks"
        description="Actionable work with status, priority, and a clear definition of done."
        actions={
          <Button disabled>
            <Plus /> New task
          </Button>
        }
      />
      <EmptyState
        icon={ListChecks}
        title="No tasks yet"
        description="Filters by company, project, status, and priority will appear here with the Tasks feature."
      />
    </PageContainer>
  );
}
