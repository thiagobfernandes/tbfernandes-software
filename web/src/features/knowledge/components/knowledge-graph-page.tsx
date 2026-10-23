import { PageContainer } from "@/components/layout/page-container";
import { PageHeading } from "@/components/shared/page-heading";
import { RelationTree } from "@/components/shared/relation-tree";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { sampleContextTree } from "@/features/dashboard/data/sample-dashboard";

export function KnowledgeGraphPage() {
  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Graph"
        description="Explore how goals, companies, projects, tasks, and notes relate. Lists and search stay the primary way to navigate."
        actions={<SampleDataBadge />}
      />
      <div className="bg-dot-grid flex min-h-[28rem] items-center rounded-2xl border px-4 py-10">
        <RelationTree root={sampleContextTree} className="w-full" />
      </div>
    </PageContainer>
  );
}
