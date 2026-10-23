import type { RelationNode } from "@/components/shared/relation-tree";

// Illustrative data so the layout can be reviewed before the API exists.
// Replace with real queries when the Companies/Projects/Tasks API is ready.

export const sampleMetrics = {
  openTasks: { value: 18, perDay: [3, 5, 2, 6, 4, 7, 5, 8, 6, 4, 9, 7, 5, 6] },
  overdue: { value: 2 },
  activeProjects: { value: 3, total: 5 },
  doneThisWeek: { value: 11, trend: [1, 2, 1, 3, 2, 4, 5] },
};

export type SampleTask = {
  id: string;
  title: string;
  project: string;
  priority: "low" | "normal" | "high" | "urgent";
  due: string;
};

export const sampleTodayTasks: SampleTask[] = [
  {
    id: "t1",
    title: "Investigate telemetry ingestion alert",
    project: "Telemetry support",
    priority: "urgent",
    due: "Today",
  },
  {
    id: "t2",
    title: "Model Company, Project and Task entities",
    project: "TBFernandes Software",
    priority: "high",
    due: "Today",
  },
  {
    id: "t3",
    title: "Review pull request for device sync",
    project: "Telemetry support",
    priority: "normal",
    due: "Tomorrow",
  },
  {
    id: "t4",
    title: "Write Flyway baseline migration",
    project: "TBFernandes Software",
    priority: "normal",
    due: "Fri",
  },
];

export type SampleProject = {
  id: string;
  name: string;
  company?: string;
  progress: number;
  nextDelivery: string;
};

export const sampleActiveProjects: SampleProject[] = [
  {
    id: "p1",
    name: "Telemetry support",
    company: "Software house",
    progress: 64,
    nextDelivery: "Monthly report · Oct 31",
  },
  {
    id: "p2",
    name: "TBFernandes Software",
    progress: 18,
    nextDelivery: "MVP: companies & tasks · Nov 15",
  },
  {
    id: "p3",
    name: "Distributed systems lab",
    progress: 35,
    nextDelivery: "Raft experiment · Nov 30",
  },
];

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
