import { LeadMessage } from '../../../domain';
import { LeadMessageEntity } from '../lead-message.entity';

export const LeadMessagePersistenceMapper = {
  toDomain(entity: LeadMessageEntity): LeadMessage {
    return LeadMessage.restore(entity.id, entity.ownerId, {
      leadId: entity.leadId,
      direction: entity.direction,
      stage: entity.stage,
      body: entity.body,
      sentAt: entity.sentAt,
    });
  },

  toEntity(message: LeadMessage): LeadMessageEntity {
    const details = message.details;
    const entity = new LeadMessageEntity();
    entity.id = message.id;
    entity.ownerId = message.ownerId;
    entity.leadId = details.leadId;
    entity.direction = details.direction;
    entity.stage = details.stage;
    entity.body = details.body;
    entity.sentAt = details.sentAt;
    return entity;
  },
};
