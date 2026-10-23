// Illustrative goals and learning data until those APIs exist.

import type { Goal, Milestone } from "@/features/goals/types/goal";
import type {
  Certification,
  Education,
  LearningMaterial,
  Skill,
  Study,
} from "@/features/learning/types/learning";

export const sampleGoals: Goal[] = [
  {
    id: "g1",
    name: "Launch TBFernandes Software MVP",
    description: "Use my own platform daily for work and personal life.",
    area: "career",
    status: "active",
    priority: "high",
    currentState: "Frontend shell and simulated flows are ready.",
    desiredResult: "Companies, projects and tasks running on the real API.",
    doneCriteria: "I manage all my tasks in it for two weeks in a row.",
    dueDate: "2026-11-15",
    indicator: {
      label: "MVP features done",
      current: 3,
      target: 8,
      unit: "features",
    },
  },
  {
    id: "g2",
    name: "Become a stronger backend engineer",
    area: "learning",
    status: "active",
    priority: "high",
    desiredResult: "Design and operate distributed systems with confidence.",
    doneCriteria: "Pass the CKAD exam and finish the distributed systems lab.",
    dueDate: "2027-03-31",
    indicator: { label: "Study hours", current: 42, target: 120, unit: "h" },
  },
  {
    id: "g3",
    name: "Build an emergency reserve",
    area: "finance",
    status: "active",
    priority: "normal",
    currentState: "Two months of expenses saved.",
    desiredResult: "Six months of personal expenses saved.",
    dueDate: "2027-06-30",
    indicator: { label: "Reserve", current: 14000, target: 42000, unit: "BRL" },
  },
  {
    id: "g4",
    name: "Pass the CKAD exam",
    area: "learning",
    status: "planned",
    priority: "normal",
    desiredResult: "CKAD certification obtained.",
    dueDate: "2027-02-28",
    parentId: "g2",
  },
];

export const sampleMilestones: Milestone[] = [
  {
    id: "m1",
    goalId: "g1",
    title: "Frontend shell",
    dueDate: "2026-10-23",
    done: true,
  },
  {
    id: "m2",
    goalId: "g1",
    title: "Companies & projects API",
    dueDate: "2026-11-01",
    done: false,
  },
  {
    id: "m3",
    goalId: "g1",
    title: "Tasks API and deploy",
    dueDate: "2026-11-15",
    done: false,
  },
  {
    id: "m4",
    goalId: "g2",
    title: "Distributed systems lab",
    dueDate: "2026-11-30",
    done: false,
  },
  {
    id: "m5",
    goalId: "g3",
    title: "Three months saved",
    dueDate: "2026-12-31",
    done: false,
  },
];

export const sampleStudies: Study[] = [
  {
    id: "st1",
    name: "Distributed systems fundamentals",
    description: "Consensus, replication, and failure handling.",
    status: "in_progress",
    goalId: "g2",
    skillIds: ["sk2"],
    startDate: "2026-10-05",
    dueDate: "2026-11-30",
    nextActivity: "Finish Raft leader election experiment",
  },
  {
    id: "st2",
    name: "Kubernetes for developers",
    status: "planned",
    goalId: "g4",
    skillIds: ["sk3"],
    startDate: "2026-11-16",
    dueDate: "2027-02-28",
    nextActivity: "Pick a course and book the exam date",
  },
];

export const sampleMaterials: LearningMaterial[] = [
  {
    id: "lm1",
    studyId: "st1",
    title: "In Search of an Understandable Consensus Algorithm",
    type: "paper",
    url: "https://raft.github.io/raft.pdf",
    status: "consumed",
  },
  {
    id: "lm2",
    studyId: "st1",
    title: "Designing Data-Intensive Applications",
    type: "book",
    status: "in_progress",
    notes: "Chapters 5, 8 and 9 first.",
  },
  {
    id: "lm3",
    studyId: "st1",
    title: "MIT 6.824 lectures",
    type: "video",
    status: "to_consume",
  },
  {
    id: "lm4",
    studyId: "st2",
    title: "Kubernetes documentation: Tasks",
    type: "docs",
    url: "https://kubernetes.io/docs/tasks/",
    status: "to_consume",
  },
];

export const sampleSkills: Skill[] = [
  {
    id: "sk1",
    name: "Java & Spring Boot",
    level: 4,
    evidence: "Five years in production systems.",
  },
  {
    id: "sk2",
    name: "Distributed systems",
    level: 2,
    evidence: "Raft lab in progress.",
  },
  { id: "sk3", name: "Kubernetes", level: 2 },
  {
    id: "sk4",
    name: "React & Next.js",
    level: 3,
    evidence: "This platform's frontend.",
  },
  { id: "sk5", name: "PostgreSQL", level: 3 },
];

export const sampleCertifications: Certification[] = [
  {
    id: "ce1",
    name: "Certified Kubernetes Application Developer",
    issuer: "CNCF",
    status: "planned",
    studyIds: ["st2"],
  },
  {
    id: "ce2",
    name: "Oracle Certified Professional: Java SE 17",
    issuer: "Oracle",
    status: "obtained",
    obtainedAt: "2024-05-12",
    studyIds: [],
  },
];

export const sampleEducations: Education[] = [
  {
    id: "ed1",
    institution: "Federal University",
    course: "Computer Science",
    degree: "Bachelor",
    status: "completed",
    startDate: "2016-02-01",
    endDate: "2020-12-15",
  },
];
