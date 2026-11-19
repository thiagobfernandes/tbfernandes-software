export type NotificationKind =
  | "prospecting_approval"
  | "prospecting_reply"
  | "prospecting_opt_out"
  | "prospecting_failed"
  | "task_due"
  | "task_overdue"
  | "contact_follow_up";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string | null;
  href?: string | null;
  createdAt: string;
  readAt?: string | null;
};
