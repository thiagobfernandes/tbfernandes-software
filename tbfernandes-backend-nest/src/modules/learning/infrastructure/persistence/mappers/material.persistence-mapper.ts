import { Material } from '../../../domain';
import { MaterialEntity } from '../material.entity';

/** Material ↔ learning.material row. */
export const MaterialPersistenceMapper = {
  toDomain(e: MaterialEntity): Material {
    return Material.restore(e.id, e.ownerId, {
      studyId: e.studyId,
      title: e.title,
      type: e.type,
      url: e.url,
      status: e.status,
      notes: e.notes,
    });
  },

  toEntity(m: Material, e: MaterialEntity = new MaterialEntity()) {
    Object.assign(e, m.details, {
      id: m.id,
      ownerId: m.ownerId,
      status: m.status,
    });
    return e;
  },
};
