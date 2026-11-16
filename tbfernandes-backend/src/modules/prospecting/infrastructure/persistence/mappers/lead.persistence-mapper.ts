import { Lead } from '../../../domain';
import { LeadEntity } from '../lead.entity';

export const LeadPersistenceMapper = {
  toDomain(entity: LeadEntity): Lead {
    return Lead.restore(entity.id, entity.ownerId, {
      externalId: entity.externalId,
      name: entity.name,
      city: entity.city,
      whatsapp: entity.whatsapp,
      instagram: entity.instagram,
      mapsUrl: entity.mapsUrl,
      classification: entity.classification,
      status: entity.status,
      notes: entity.notes,
      firstContactAt: entity.firstContactAt,
      lastMessageAt: entity.lastMessageAt,
      lastReplyAt: entity.lastReplyAt,
    });
  },

  toEntity(lead: Lead, entity: LeadEntity = new LeadEntity()): LeadEntity {
    const details = lead.details;
    entity.id = lead.id;
    entity.ownerId = lead.ownerId;
    entity.externalId = details.externalId;
    entity.name = details.name;
    entity.city = details.city;
    entity.whatsapp = details.whatsapp;
    entity.instagram = details.instagram;
    entity.mapsUrl = details.mapsUrl;
    entity.classification = details.classification;
    entity.status = details.status;
    entity.notes = details.notes;
    entity.firstContactAt = details.firstContactAt;
    entity.lastMessageAt = details.lastMessageAt;
    entity.lastReplyAt = details.lastReplyAt;
    return entity;
  },
};
