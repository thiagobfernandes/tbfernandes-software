/** Same shape as the frontend's Company type. */
export class CompanyResponse {
  id: string;
  name: string;
  tradeName: string | null;
  relationship: string;
  status: string;
  description: string | null;
  startDate: string;
  mainContact: string | null;
}
