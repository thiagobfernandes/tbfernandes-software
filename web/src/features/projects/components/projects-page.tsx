import { FolderKanban, Plus } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";

export function ProjectsPage() {
  return (
    <PageContainer>
      <PageHeading
        title="Projects"
        description="Professional, personal, and study projects grouped by outcome."
        actions={
          <Button disabled>
            <Plus /> New project
          </Button>
        }
      />
      <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        description="A project can belong to a company or stand on its own. Creating projects arrives with the Projects feature."
      />
    </PageContainer>
  );
}
