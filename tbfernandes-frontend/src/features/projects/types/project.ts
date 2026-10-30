export type ProjectStatus = "planned" | "active" | "paused" | "completed";
export const projectStatusLabels: Record<ProjectStatus, string> = {
  planned: "Planejado",
  active: "Ativo",
  paused: "Pausado",
  completed: "Concluído",
};

export const companyStatusLabels: Record<CompanyStatus, string> = {
  active: "Ativa",
  inactive: "Inativa",
  closed: "Encerrada",
};

export type ProjectCategory =
  "professional" | "personal" | "study" | "research";
export type ProjectColor = "teal" | "violet" | "amber" | "rose" | "sky";

export type CompanyRelationship = "contractor" | "client" | "partner" | "own";
export type CompanyStatus = "active" | "inactive" | "closed";

export type Company = {
  id: string;
  name: string;
  tradeName?: string;
  relationship: CompanyRelationship;
  status: CompanyStatus;
  description?: string;
  startDate: string;
  mainContact?: string;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  companyId?: string;
  category: ProjectCategory;
  status: ProjectStatus;
  color: ProjectColor;
  startDate: string;
  dueDate?: string;
  nextDelivery?: string;
  goalId?: string;
};
