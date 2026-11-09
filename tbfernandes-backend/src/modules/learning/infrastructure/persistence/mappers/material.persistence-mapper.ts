import { Material } from '../../../domain';
import { MaterialEntity } from '../material.entity';

export const MaterialPersistenceMapper = {
  toDomain(entity: MaterialEntity): Material {
    return Material.restore(entity.id, entity.ownerId, {
      studyId: entity.studyId,
      title: entity.title,
      type: entity.type,
      url: entity.url,
      status: entity.status,
      notes: entity.notes,
    });
  },

  toEntity(material: Material, entity: MaterialEntity = new MaterialEntity()) {
    Object.assign(entity, material.details, {
      id: material.id,
      ownerId: material.ownerId,
      status: material.status,
    });
    return entity;
  },
};
