/** The accounts whose reminders are checked on a timer (one person: the configured owner). */
export abstract class OwnerDirectory {
  abstract owners(): string[];
}
