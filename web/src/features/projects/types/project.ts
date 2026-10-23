export type ProjectStatus = "planned" | "active" | "paused" | "completed";
export type ProjectCategory =
  "professional" | "personal" | "study" | "research";
export type ProjectColor = "teal" | "violet" | "amber" | "rose" | "sky";

export type Company = {
  id: string;
  name: string;
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
};
