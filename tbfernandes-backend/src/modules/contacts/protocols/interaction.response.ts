/** Same shape as the frontend's Interaction type. */
export class InteractionResponse {
  id: string;
  contactId: string;
  date: string;
  kind: string;
  summary: string;
  followUpTaskId: string | null;
}
