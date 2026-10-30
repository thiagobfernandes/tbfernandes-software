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
      "Software house para a qual presto serviços de desenvolvimento como PJ.",
    startDate: "2025-03-10",
    mainContact: "Gerente de engenharia",
  },
  {
    id: "c2",
    name: "TBFernandes PJ",
    tradeName: "TBFernandes Software",
    relationship: "own",
    status: "active",
    description:
      "Minha própria empresa: contratos, faturamento e produtos próprios.",
    startDate: "2024-08-01",
  },
  {
    id: "c3",
    name: "Agência anterior",
    relationship: "client",
    status: "closed",
    description: "Ex-cliente de landing pages e integrações.",
    startDate: "2023-02-01",
  },
];

export const sampleProjects: Project[] = [
  {
    id: "p1",
    name: "Suporte de telemetria",
    description:
      "Manutenção e evolução da plataforma de telemetria do cliente.",
    companyId: "c1",
    category: "professional",
    status: "active",
    color: "violet",
    startDate: "2026-09-01",
    dueDate: "2026-12-19",
    nextDelivery: "Relatório mensal · 31/10",
  },
  {
    id: "p2",
    name: "TBFernandes Software",
    description:
      "Esta plataforma: empresas, projetos, tarefas, depois metas e IA.",
    companyId: "c2",
    category: "personal",
    status: "active",
    color: "teal",
    startDate: "2026-10-20",
    dueDate: "2026-11-15",
    nextDelivery: "MVP: empresas e tarefas · 15/11",
    goalId: "g1",
  },
  {
    id: "p3",
    name: "Laboratório de sistemas distribuídos",
    description:
      "Experimentos práticos: consenso, mensageria, tolerância a falhas.",
    category: "study",
    status: "active",
    color: "amber",
    startDate: "2026-10-05",
    dueDate: "2026-11-30",
    nextDelivery: "Experimento Raft · 30/11",
    goalId: "g2",
  },
  {
    id: "p4",
    name: "Certificação Kubernetes",
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
    title: "Investigar alerta de ingestão da telemetria",
    description:
      "Atraso de ingestão acima de 5 min desde o último deploy. Encontrar a causa raiz e documentar.",
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
    title: "Modelar as entidades Empresa, Projeto e Tarefa",
    description:
      "Entidades, relacionamentos e regras de negócio do MVP, prontos para a baseline do Flyway.",
    projectId: "p2",
    status: "in_progress",
    priority: "high",
    tag: "Modelagem",
    startDate: "2026-10-21",
    dueDate: "2026-10-23",
    checklist: { done: 3, total: 6 },
  },
  {
    id: "t3",
    title: "Revisar pull request de sincronização de dispositivos",
    projectId: "p1",
    status: "todo",
    priority: "normal",
    tag: "Revisão",
    startDate: "2026-10-24",
    dueDate: "2026-10-24",
  },
  {
    id: "t4",
    title: "Escrever a migration baseline do Flyway",
    description:
      "Tabelas de empresas, projetos, tarefas e itens de checklist com owner_id.",
    projectId: "p2",
    status: "todo",
    priority: "normal",
    tag: "Banco de dados",
    startDate: "2026-10-24",
    dueDate: "2026-10-27",
  },
  {
    id: "t5",
    title: "Estrutura base do frontend",
    description:
      "Next.js, tokens de tema, menu lateral, dashboard e componentes compartilhados.",
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
    title: "Relatório mensal de telemetria",
    projectId: "p1",
    status: "backlog",
    priority: "normal",
    tag: "Relatório",
    startDate: "2026-10-28",
    dueDate: "2026-10-31",
  },
  {
    id: "t7",
    title: "Experimento de eleição de líder no Raft",
    description:
      "Três nós locais, injetar partições, registrar os tempos de eleição.",
    projectId: "p3",
    status: "in_progress",
    priority: "normal",
    tag: "Estudo",
    startDate: "2026-10-19",
    dueDate: "2026-10-29",
    checklist: { done: 1, total: 4 },
  },
  {
    id: "t8",
    title: "Aguardando acesso à VPN do cliente",
    projectId: "p1",
    status: "blocked",
    priority: "high",
    tag: "Acesso",
    startDate: "2026-10-20",
    dueDate: "2026-10-21",
  },
  {
    id: "t9",
    title: "API de CRUD de empresas",
    projectId: "p2",
    status: "backlog",
    priority: "high",
    tag: "Backend",
    startDate: "2026-10-27",
    dueDate: "2026-10-30",
  },
  {
    id: "t10",
    title: "Renovar contrato com o contador",
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
