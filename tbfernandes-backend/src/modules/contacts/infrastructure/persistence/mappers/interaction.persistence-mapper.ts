import { Interaction } from '../../../domain';
import { InteractionEntity } from '../interaction.entity';

/** Interaction ↔ contacts.interaction row. */
export const InteractionPersistenceMapper = {
  toDomain(e: InteractionEntity): Interaction {
    return Interaction.restore(e.id, e.ownerId, {
      contactId: e.contactId,
      date: e.occurredOn,
      kind: e.kind,
      summary: e.summary,
      followUpTaskId: e.followUpTaskId,
    });
  },

  toEntity(
    interaction: Interaction,
    e: InteractionEntity = new InteractionEntity(),
  ): InteractionEntity {
    const d = interaction.details;
    e.id = interaction.id;
    e.ownerId = interaction.ownerId;
    e.contactId = d.contactId;
    e.occurredOn = d.date;
    e.kind = d.kind;
    e.summary = d.summary;
    e.followUpTaskId = d.followUpTaskId;
    return e;
  },
};
