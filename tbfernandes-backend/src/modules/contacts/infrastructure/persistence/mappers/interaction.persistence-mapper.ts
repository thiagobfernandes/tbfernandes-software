import { Interaction } from '../../../domain';
import { InteractionEntity } from '../interaction.entity';

export const InteractionPersistenceMapper = {
  toDomain(entity: InteractionEntity): Interaction {
    return Interaction.restore(entity.id, entity.ownerId, {
      contactId: entity.contactId,
      date: entity.occurredOn,
      kind: entity.kind,
      summary: entity.summary,
      followUpTaskId: entity.followUpTaskId,
    });
  },

  toEntity(
    interaction: Interaction,
    entity: InteractionEntity = new InteractionEntity(),
  ): InteractionEntity {
    const details = interaction.details;
    entity.id = interaction.id;
    entity.ownerId = interaction.ownerId;
    entity.contactId = details.contactId;
    entity.occurredOn = details.date;
    entity.kind = details.kind;
    entity.summary = details.summary;
    entity.followUpTaskId = details.followUpTaskId;
    return entity;
  },
};
