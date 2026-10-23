import type { RelationNode } from "@/components/shared/relation-tree";

// Illustrative data so the layout can be reviewed before the API exists.
// Replace with real queries when the Companies/Projects/Tasks API is ready.

// Trend series are illustrative; the headline numbers are derived from the
// shared sample tasks and projects in the dashboard page.
export const sampleTrends = {
  openTasksPerDay: [3, 5, 2, 6, 4, 7, 5, 8, 6, 4, 9, 7, 5, 6],
  doneLastSevenDays: [0, 1, 0, 2, 1, 1, 1],
};

export const sampleContextTree: RelationNode = {
  id: "g1",
  kind: "Goal",
  label: "Increase professional income",
  children: [
    {
      id: "c1",
      kind: "Company",
      label: "Software house",
      children: [
        {
          id: "p1",
          kind: "Project",
          label: "Telemetry support",
          children: [
            { id: "t1", label: "Ingestion alert" },
            { id: "t3", label: "Device sync review" },
          ],
        },
      ],
    },
    {
      id: "p2",
      kind: "Project",
      label: "TBFernandes Software",
      children: [
        { id: "t2", label: "Domain model" },
        { id: "t4", label: "Flyway baseline" },
      ],
    },
    {
      id: "s1",
      kind: "Skill",
      label: "Distributed systems",
      children: [{ id: "p3", label: "Raft experiment" }],
    },
  ],
};
