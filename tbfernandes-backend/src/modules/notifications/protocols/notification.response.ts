export class NotificationResponse {
  id: string;
  /** prospecting_approval, prospecting_reply, prospecting_opt_out, prospecting_failed, task_due, task_overdue or contact_follow_up */
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  createdAt: string;
  readAt: string | null;
}

export class NotificationSummaryResponse {
  unread: number;
}
