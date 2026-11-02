import { Interaction } from './interaction';

/** Implemented in infrastructure/persistence. */
export abstract class InteractionRepository {
  abstract create(interaction: Interaction): Promise<Interaction>;
  abstract save(interaction: Interaction): Promise<Interaction>;
  abstract findById(ownerId: string, id: string): Promise<Interaction | null>;
  /** Newest first; all of the owner's when contactId is null. */
  abstract findAll(
    ownerId: string,
    contactId: string | null,
  ): Promise<Interaction[]>;
  abstract findByFollowUpTask(
    ownerId: string,
    taskId: string,
  ): Promise<Interaction[]>;
  abstract delete(interaction: Interaction): Promise<void>;
}
