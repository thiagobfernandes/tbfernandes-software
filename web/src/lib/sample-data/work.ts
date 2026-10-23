// Illustrative data so screens can be reviewed before the API exists.
// Every screen that reads from here shows a "Sample data" badge.
// Delete this file once Companies/Projects/Tasks come from the API.

import type { Company, Project } from "@/features/projects/types/project";
import type { Task } from "@/features/tasks/types/task";

/** Fixed "today" so sample screens render the same on every build. */
export const SAMPLE_TODAY = "2026-10-23";

export const sampleCompanies: Company[] = [
  {
    id: "c1",
    name: "Software house",
    relationship: "contractor",
    status: "active",
    description:
      "Software house I provide development services to as a PJ contractor.",
    startDate: "2025-03-10",
    mainContact: "Engineering manager",
  },
  {
    id: "c2",
    name: "TBFernandes PJ",
    tradeName: "TBFernandes Software",
    relationship: "own",
    status: "active",
    description: "My own company: contracts, invoicing, and personal products.",
    startDate: "2024-08-01",
  },
  {
    id: "c3",
    name: "Previous agency",
    relationship: "client",
    status: "closed",
    description: "Former client for landing pages and integrations.",
    startDate: "2023-02-01",
  },
];

export const sampleProjects: Project[] = [
  {
    id: "p1",
    name: "Telemetry support",
    description:
      "Maintenance and evolution of the client's telemetry platform.",
    companyId: "c1",
    category: "professional",
    status: "active",
    color: "violet",
    startDate: "2026-09-01",
    dueDate: "2026-12-19",
    nextDelivery: "Monthly report · Oct 31",
  },
  {
    id: "p2",
    name: "TBFernandes Software",
    description:
      "This platform: companies, projects, tasks, then goals and AI.",
    companyId: "c2",
    category: "personal",
    status: "active",
    color: "teal",
    startDate: "2026-10-20",
    dueDate: "2026-11-15",
    nextDelivery: "MVP: companies & tasks · Nov 15",
    goalId: "g1",
  },
  {
    id: "p3",
    name: "Distributed systems lab",
    description: "Hands-on experiments: consensus, messaging, fault tolerance.",
    category: "study",
    status: "active",
    color: "amber",
    startDate: "2026-10-05",
    dueDate: "2026-11-30",
    nextDelivery: "Raft experiment · Nov 30",
    goalId: "g2",
  },
  {
    id: "p4",
    name: "Kubernetes certification",
    category: "study",
    status: "planned",
    color: "sky",
    startDate: "2026-11-16",
    goalId: "g2",
  },
];

export const sampleTasks: Task[] = [
  {
    id: "t1",
    title: "Investigate telemetry ingestion alert",
    description:
      "Ingestion lag above 5 min since the last deploy. Find root cause and document it.",
    projectId: "p1",
    status: "in_progress",
    priority: "urgent",
    tag: "Backend",
    startDate: "2026-10-22",
    dueDate: "2026-10-23",
    checklist: { done: 2, total: 5 },
  },
  {
    id: "t2",
    title: "Model Company, Project and Task entities",
    description:
      "Entities, relationships, and business rules for the MVP, ready for the Flyway baseline.",
    projectId: "p2",
    status: "in_progress",
    priority: "high",
    tag: "Modeling",
    startDate: "2026-10-21",
    dueDate: "2026-10-23",
    checklist: { done: 3, total: 6 },
  },
  {
    id: "t3",
    title: "Review pull request for device sync",
    projectId: "p1",
    status: "todo",
    priority: "normal",
    tag: "Review",
    startDate: "2026-10-24",
    dueDate: "2026-10-24",
  },
  {
    id: "t4",
    title: "Write Flyway baseline migration",
    description:
      "Tables for companies, projects, tasks, and checklist items with owner_id.",
    projectId: "p2",
    status: "todo",
    priority: "normal",
    tag: "Database",
    startDate: "2026-10-24",
    dueDate: "2026-10-27",
  },
  {
    id: "t5",
    title: "Frontend app shell",
    description:
      "Next.js, theme tokens, sidebar, dashboard, and shared components.",
    projectId: "p2",
    status: "done",
    priority: "high",
    tag: "Frontend",
    startDate: "2026-10-20",
    dueDate: "2026-10-22",
    checklist: { done: 6, total: 6 },
  },
  {
    id: "t6",
    title: "Monthly telemetry report",
    projectId: "p1",
    status: "backlog",
    priority: "normal",
    tag: "Report",
    startDate: "2026-10-28",
    dueDate: "2026-10-31",
  },
  {
    id: "t7",
    title: "Raft leader election experiment",
    description:
      "Three nodes locally, inject partitions, record election times.",
    projectId: "p3",
    status: "in_progress",
    priority: "normal",
    tag: "Study",
    startDate: "2026-10-19",
    dueDate: "2026-10-29",
    checklist: { done: 1, total: 4 },
  },
  {
    id: "t8",
    title: "Waiting on client VPN access",
    projectId: "p1",
    status: "blocked",
    priority: "high",
    tag: "Access",
    startDate: "2026-10-20",
    dueDate: "2026-10-21",
  },
  {
    id: "t9",
    title: "Companies CRUD API",
    projectId: "p2",
    status: "backlog",
    priority: "high",
    tag: "Backend",
    startDate: "2026-10-27",
    dueDate: "2026-10-30",
  },
  {
    id: "t10",
    title: "Renew accountant contract",
    status: "todo",
    priority: "low",
    tag: "Admin",
    dueDate: "2026-10-30",
  },
];

export function findProject(id?: string) {
  return sampleProjects.find((project) => project.id === id);
}

export function findCompany(id?: string) {
  return sampleCompanies.find((company) => company.id === id);
}

export function projectsOfCompany(companyId: string) {
  return sampleProjects.filter((project) => project.companyId === companyId);
}

export function tasksOfProject(projectId: string) {
  return sampleTasks.filter((task) => task.projectId === projectId);
}

export function isOpenTask(task: Task) {
  return task.status !== "done" && task.status !== "canceled";
}
