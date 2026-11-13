import { Routine, Weekday } from '../../../domain';
import { RoutineEntity } from '../routine.entity';

export const RoutinePersistenceMapper = {
  toDomain(entity: RoutineEntity): Routine {
    return Routine.restore(entity.id, entity.ownerId, {
      title: entity.title,
      description: entity.description,
      projectId: entity.projectId,
      taskId: entity.taskId,
      weekdays: entity.weekdays.map(Number) as Weekday[],
      startTime: entity.startTime,
      targetMinutes: entity.targetMinutes,
      startDate: entity.startDate,
      active: entity.active,
    });
  },

  toEntity(
    routine: Routine,
    entity: RoutineEntity = new RoutineEntity(),
  ): RoutineEntity {
    const details = routine.details;
    entity.id = routine.id;
    entity.ownerId = routine.ownerId;
    entity.title = details.title;
    entity.description = details.description;
    entity.projectId = details.projectId;
    entity.taskId = details.taskId;
    entity.weekdays = details.weekdays;
    entity.startTime = details.startTime;
    entity.targetMinutes = details.targetMinutes;
    entity.startDate = details.startDate;
    entity.active = details.active;
    return entity;
  },
};
