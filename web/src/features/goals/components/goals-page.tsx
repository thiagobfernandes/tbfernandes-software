import { Plus } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeading } from "@/components/shared/page-heading";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import { GoalCard } from "@/features/goals/components/goal-card";
import { findLearningTrack, sampleGoals } from "@/lib/sample-data/growth";
import { SAMPLE_TODAY } from "@/lib/sample-data/work";

export function GoalsPage() {
  return (
    <PageContainer>
      <PageHeading
        title="Goals"
        description="Long-term outcomes, broken into milestones and backed by learning tracks."
        actions={
          <>
            <SampleDataBadge />
            <Button disabled>
              <Plus /> New goal
            </Button>
          </>
        }
      />

      <div className="grid gap-4">
        {sampleGoals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            today={SAMPLE_TODAY}
            tracks={goal.learningTrackIds
              .map(findLearningTrack)
              .filter((track) => track !== undefined)}
          />
        ))}
      </div>
    </PageContainer>
  );
}
