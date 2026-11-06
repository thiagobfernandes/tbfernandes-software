export interface DomainEvent {
  readonly type: string;
  readonly ownerId: string;
}
