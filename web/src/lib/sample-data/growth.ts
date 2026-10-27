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
    name: "Lançar o MVP do TBFernandes Software",
    description:
      "Usar minha própria plataforma todo dia no trabalho e na vida pessoal.",
    area: "career",
    status: "active",
    priority: "high",
    currentState:
      "A estrutura do frontend e os fluxos simulados estão prontos.",
    desiredResult: "Empresas, projetos e tarefas rodando na API real.",
    doneCriteria:
      "Gerencio todas as minhas tarefas nela por duas semanas seguidas.",
    dueDate: "2026-11-15",
    indicator: {
      label: "Funcionalidades do MVP prontas",
      current: 3,
      target: 8,
      unit: "funcionalidades",
    },
  },
  {
    id: "g2",
    name: "Ser um engenheiro de backend mais forte",
    area: "learning",
    status: "active",
    priority: "high",
    desiredResult: "Projetar e operar sistemas distribuídos com segurança.",
    doneCriteria:
      "Passar no exame CKAD e terminar o laboratório de sistemas distribuídos.",
    dueDate: "2027-03-31",
    indicator: {
      label: "Horas de estudo",
      current: 42,
      target: 120,
      unit: "h",
    },
  },
  {
    id: "g3",
    name: "Montar uma reserva de emergência",
    area: "finance",
    status: "active",
    priority: "normal",
    currentState: "Dois meses de despesas guardados.",
    desiredResult: "Seis meses de despesas pessoais guardados.",
    dueDate: "2027-06-30",
    indicator: { label: "Reserva", current: 14000, target: 42000, unit: "BRL" },
  },
  {
    id: "g4",
    name: "Passar no exame CKAD",
    area: "learning",
    status: "planned",
    priority: "normal",
    desiredResult: "Certificação CKAD obtida.",
    dueDate: "2027-02-28",
    parentId: "g2",
  },
];

export const sampleMilestones: Milestone[] = [
  {
    id: "m1",
    goalId: "g1",
    title: "Estrutura do frontend",
    dueDate: "2026-10-23",
    done: true,
  },
  {
    id: "m2",
    goalId: "g1",
    title: "API de empresas e projetos",
    dueDate: "2026-11-01",
    done: false,
  },
  {
    id: "m3",
    goalId: "g1",
    title: "API de tarefas e deploy",
    dueDate: "2026-11-15",
    done: false,
  },
  {
    id: "m4",
    goalId: "g2",
    title: "Laboratório de sistemas distribuídos",
    dueDate: "2026-11-30",
    done: false,
  },
  {
    id: "m5",
    goalId: "g3",
    title: "Três meses guardados",
    dueDate: "2026-12-31",
    done: false,
  },
];

export const sampleStudies: Study[] = [
  {
    id: "st1",
    name: "Fundamentos de sistemas distribuídos",
    description: "Consenso, replicação e tratamento de falhas.",
    status: "in_progress",
    goalId: "g2",
    skillIds: ["sk2"],
    startDate: "2026-10-05",
    dueDate: "2026-11-30",
    nextActivity: "Terminar o experimento de eleição de líder no Raft",
  },
  {
    id: "st2",
    name: "Kubernetes para desenvolvedores",
    status: "planned",
    goalId: "g4",
    skillIds: ["sk3"],
    startDate: "2026-11-16",
    dueDate: "2027-02-28",
    nextActivity: "Escolher um curso e marcar a data do exame",
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
    notes: "Capítulos 5, 8 e 9 primeiro.",
  },
  {
    id: "lm3",
    studyId: "st1",
    title: "Aulas do MIT 6.824",
    type: "video",
    status: "to_consume",
  },
  {
    id: "lm4",
    studyId: "st2",
    title: "Documentação do Kubernetes: Tasks",
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
    evidence: "Cinco anos em sistemas de produção.",
  },
  {
    id: "sk2",
    name: "Sistemas distribuídos",
    level: 2,
    evidence: "Laboratório de Raft em andamento.",
  },
  { id: "sk3", name: "Kubernetes", level: 2 },
  {
    id: "sk4",
    name: "React & Next.js",
    level: 3,
    evidence: "O frontend desta plataforma.",
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
    institution: "Universidade Federal",
    course: "Ciência da Computação",
    degree: "Bacharelado",
    status: "completed",
    startDate: "2016-02-01",
    endDate: "2020-12-15",
  },
];
