import { SendRequest } from '../../../domain';
import { SendRequestEntity } from '../send-request.entity';

export const SendRequestPersistenceMapper = {
  toDomain(entity: SendRequestEntity): SendRequest {
    return SendRequest.restore(entity.id, entity.ownerId, {
      leadId: entity.leadId,
      stage: entity.stage,
      body: entity.body,
      status: entity.status,
      requestedAt: entity.requestedAt,
      autoSendAt: entity.autoSendAt,
      resolvedAt: entity.resolvedAt,
      error: entity.error,
    });
  },

  toEntity(
    request: SendRequest,
    entity: SendRequestEntity = new SendRequestEntity(),
  ): SendRequestEntity {
    const details = request.details;
    entity.id = request.id;
    entity.ownerId = request.ownerId;
    entity.leadId = details.leadId;
    entity.stage = details.stage;
    entity.body = details.body;
    entity.status = details.status;
    entity.requestedAt = details.requestedAt;
    entity.autoSendAt = details.autoSendAt;
    entity.resolvedAt = details.resolvedAt;
    entity.error = details.error;
    return entity;
  },
};
