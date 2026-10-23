import { BookOpen, Plus } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";

export function KnowledgePage() {
  return (
    <PageContainer>
      <PageHeading
        title="Notes"
        description="Programming notes you can link to projects and tasks."
        actions={
          <Button disabled>
            <Plus /> New note
          </Button>
        }
      />
      <EmptyState
        icon={BookOpen}
        title="No notes yet"
        description="Markdown notes with tags and search arrive with the Knowledge feature."
      />
    </PageContainer>
  );
}
