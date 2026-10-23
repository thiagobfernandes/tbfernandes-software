import { Code2, Plus } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";

export function SnippetsPage() {
  return (
    <PageContainer>
      <PageHeading
        title="Snippets"
        description="Reusable code with language, usage notes, and links to projects and tasks."
        actions={
          <Button disabled>
            <Plus /> New snippet
          </Button>
        }
      />
      <EmptyState
        icon={Code2}
        title="No snippets yet"
        description="Syntax highlighting and copy-to-clipboard arrive with the Knowledge feature. Stored code is never executed."
      />
    </PageContainer>
  );
}
