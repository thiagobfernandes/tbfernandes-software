export class ContactResponse {
  id: string;
  name: string;
  companyId: string | null;
  companyName: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  profileUrl: string | null;
  specialties: string[];
  context: string | null;
  nextContact: string | null;
  notes: string | null;
}
