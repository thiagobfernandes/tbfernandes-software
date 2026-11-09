export class ProjectResponse {
  id: string;
  name: string;
  description: string | null;
  companyId: string | null;
  category: string;
  status: string;
  color: string;
  startDate: string;
  dueDate: string | null;
  nextDelivery: string | null;
  goalId: string | null;
}
