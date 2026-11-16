import { Require } from '../../../common/domain';

export const NOTIFICATION_KINDS = [
  'PROSPECTING_APPROVAL',
  'PROSPECTING_REPLY',
  'PROSPECTING_OPT_OUT',
  'PROSPECTING_FAILED',
  'TASK_DUE',
  'TASK_OVERDUE',
  'CONTACT_FOLLOW_UP',
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export interface NotificationContent {
  kind: NotificationKind;
  title: string;
  body: string | null;
  /** Screen to open, e.g. /prospecting?lead=… */
  href: string | null;
  /** RN-39: one notification per key and owner (e.g. "task-due:<id>:<day>"). */
  key: string;
}

export interface NotificationDetails extends NotificationContent {
  createdAt: Date;
  readAt: Date | null;
}

/** Something the user should see (RF-NTF-01). Only its read mark changes. */
export class Notification {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: NotificationDetails,
  ) {}

  static create(
    id: string,
    ownerId: string,
    content: NotificationContent,
    now: Date,
  ): Notification {
    return new Notification(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      {
        kind: Require.present(content.kind, 'kind'),
        title: Require.text(content.title, 'title', 200),
        body: Require.optionalText(truncate(content.body, 1000), 'body', 1000),
        href: Require.optionalText(content.href, 'href', 500),
        key: Require.text(content.key, 'key', 200),
        createdAt: now,
        readAt: null,
      },
    );
  }

  static restore(
    id: string,
    ownerId: string,
    details: NotificationDetails,
  ): Notification {
    return new Notification(id, ownerId, details);
  }

  get details(): NotificationDetails {
    return { ...this._details };
  }

  get unread(): boolean {
    return this._details.readAt == null;
  }

  markRead(now: Date): void {
    if (this._details.readAt == null)
      this._details = { ...this._details, readAt: now };
  }
}

function truncate(text: string | null, max: number): string | null {
  if (text == null) return null;
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}
