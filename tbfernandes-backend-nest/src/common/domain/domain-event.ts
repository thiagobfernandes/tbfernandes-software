/** Something that happened in a module and that other modules may react to. */
export interface DomainEvent {
  /** Event name, e.g. "work.task-completed". */
  readonly type: string;
  readonly ownerId: string;
}
