import { RoutineCheck } from '../../../domain';
import { RoutineCheckEntity } from '../routine-check.entity';

export const RoutineCheckPersistenceMapper = {
  toDomain(entity: RoutineCheckEntity): RoutineCheck {
    return RoutineCheck.restore(entity.id, entity.ownerId, {
      routineId: entity.routineId,
      date: entity.day,
      note: entity.note,
    });
  },

  toEntity(
    check: RoutineCheck,
    entity: RoutineCheckEntity = new RoutineCheckEntity(),
  ): RoutineCheckEntity {
    const details = check.details;
    entity.id = check.id;
    entity.ownerId = check.ownerId;
    entity.routineId = details.routineId;
    entity.day = details.date;
    entity.note = details.note;
    return entity;
  },
};
