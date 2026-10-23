"use client";

// Client-side store that simulates the API: starts from the sample data and
// keeps changes in this browser (localStorage). Replace with API calls once
// the Spring Boot endpoints exist.

import { useSyncExternalStore } from "react";

import type { Contact, Interaction } from "@/features/contacts/types/contact";
import type {
  FinanceEntry,
  PurchaseGoal,
} from "@/features/finance/types/finance";
import type { Goal, Milestone } from "@/features/goals/types/goal";
import type { Note, Snippet } from "@/features/knowledge/types/knowledge";
import type {
  Certification,
  Education,
  LearningMaterial,
  Skill,
  Study,
} from "@/features/learning/types/learning";
import type { Method } from "@/features/methods/types/method";
import type { Company, Project } from "@/features/projects/types/project";
import type { Task } from "@/features/tasks/types/task";
import {
  sampleCertifications,
  sampleEducations,
  sampleGoals,
  sampleMaterials,
  sampleMilestones,
  sampleSkills,
  sampleStudies,
} from "@/lib/sample-data/growth";
import { sampleNotes, sampleSnippets } from "@/lib/sample-data/knowledge";
import {
  sampleContacts,
  sampleFinanceEntries,
  sampleInteractions,
  samplePurchases,
} from "@/lib/sample-data/life";
import { sampleMethods } from "@/lib/sample-data/methods";
import {
  SAMPLE_TODAY,
  sampleCompanies,
  sampleProjects,
  sampleTasks,
} from "@/lib/sample-data/work";

export type AppData = {
  companies: Company[];
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  snippets: Snippet[];
  methods: Method[];
  goals: Goal[];
  milestones: Milestone[];
  studies: Study[];
  materials: LearningMaterial[];
  skills: Skill[];
  certifications: Certification[];
  educations: Education[];
  financeEntries: FinanceEntry[];
  purchases: PurchaseGoal[];
  contacts: Contact[];
  interactions: Interaction[];
};

/** Kept for the work screens written before the other modules existed. */
export type WorkData = AppData;

export type CollectionKey = keyof AppData;
type Item<K extends CollectionKey> = AppData[K][number];

const STORAGE_KEY = "tbf-sample-data-v2";
const LEGACY_WORK_KEY = "tbf-sample-work-v1";

const initialData: AppData = {
  companies: sampleCompanies,
  projects: sampleProjects,
  tasks: sampleTasks,
  notes: sampleNotes,
  snippets: sampleSnippets,
  methods: sampleMethods,
  goals: sampleGoals,
  milestones: sampleMilestones,
  studies: sampleStudies,
  materials: sampleMaterials,
  skills: sampleSkills,
  certifications: sampleCertifications,
  educations: sampleEducations,
  financeEntries: sampleFinanceEntries,
  purchases: samplePurchases,
  contacts: sampleContacts,
  interactions: sampleInteractions,
};

const idPrefixes: Record<CollectionKey, string> = {
  companies: "c",
  projects: "p",
  tasks: "t",
  notes: "n",
  snippets: "s",
  methods: "mt",
  goals: "g",
  milestones: "m",
  studies: "st",
  materials: "lm",
  skills: "sk",
  certifications: "ce",
  educations: "ed",
  financeEntries: "f",
  purchases: "pu",
  contacts: "ct",
  interactions: "i",
};

let state: AppData | undefined;
const listeners = new Set<() => void>();

function load(): AppData {
  if (state) return state;
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      // Carry over work data saved before the other modules existed.
      localStorage.getItem(LEGACY_WORK_KEY);
    // Stored collections win; collections added later start from samples.
    state = raw
      ? { ...initialData, ...(JSON.parse(raw) as Partial<AppData>) }
      : initialData;
  } catch {
    state = initialData;
  }
  return state;
}

function commit(next: AppData) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable: changes last until the page reloads.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppData() {
  return useSyncExternalStore(subscribe, load, () => initialData);
}

export const useWorkData = useAppData;

/** Generic create, update and delete over any collection. */
export const dataActions = {
  create<K extends CollectionKey>(key: K, item: Omit<Item<K>, "id">) {
    const created = {
      ...item,
      id: `${idPrefixes[key]}-${crypto.randomUUID().slice(0, 8)}`,
    } as Item<K>;
    const data = load();
    commit({ ...data, [key]: [...data[key], created] });
    return created;
  },
  update<K extends CollectionKey>(key: K, id: string, patch: Partial<Item<K>>) {
    const data = load();
    commit({
      ...data,
      [key]: (data[key] as Item<K>[]).map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  },
  remove<K extends CollectionKey>(key: K, id: string) {
    const data = load();
    commit({
      ...data,
      [key]: (data[key] as Item<K>[]).filter((item) => item.id !== id),
    });
  },
  get<K extends CollectionKey>(key: K, id?: string) {
    return (load()[key] as Item<K>[]).find((item) => item.id === id);
  },
  reset() {
    commit(initialData);
  },
};

export const workActions = {
  addCompany: (company: Omit<Company, "id">) =>
    dataActions.create("companies", company),
  updateCompany: (id: string, patch: Partial<Company>) =>
    dataActions.update("companies", id, patch),
  addProject: (project: Omit<Project, "id">) =>
    dataActions.create("projects", project),
  updateProject: (id: string, patch: Partial<Project>) =>
    dataActions.update("projects", id, patch),
  addTask: (task: Omit<Task, "id">) =>
    dataActions.create("tasks", {
      ...task,
      completedAt: task.status === "done" ? SAMPLE_TODAY : undefined,
    }),
  updateTask(id: string, patch: Partial<Task>) {
    const task = dataActions.get("tasks", id);
    if (!task) return;
    const next = { ...task, ...patch };
    // Completing a task records when; reopening it clears that.
    if (next.status === "done" && task.status !== "done")
      next.completedAt = SAMPLE_TODAY;
    if (next.status !== "done") next.completedAt = undefined;
    dataActions.update("tasks", id, next);
  },
  deleteTask: (id: string) => dataActions.remove("tasks", id),
  reset: () => dataActions.reset(),
};

/** Lookup helpers over a snapshot from useAppData(). */
export function selectors(data: AppData) {
  return {
    findCompany: (id?: string) =>
      data.companies.find((company) => company.id === id),
    findProject: (id?: string) =>
      data.projects.find((project) => project.id === id),
    findTask: (id?: string) => data.tasks.find((task) => task.id === id),
    findGoal: (id?: string) => data.goals.find((goal) => goal.id === id),
    projectsOfCompany: (companyId: string) =>
      data.projects.filter((project) => project.companyId === companyId),
    tasksOfProject: (projectId: string) =>
      data.tasks.filter((task) => task.projectId === projectId),
    projectsById: new Map(
      data.projects.map((project) => [project.id, project]),
    ),
  };
}
