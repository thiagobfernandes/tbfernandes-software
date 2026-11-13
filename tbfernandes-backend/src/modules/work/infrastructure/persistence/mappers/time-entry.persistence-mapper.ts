import { TimeEntry } from '../../../domain';
import { TimeEntryEntity } from '../time-entry.entity';

export const TimeEntryPersistenceMapper = {
  toDomain(entity: TimeEntryEntity): TimeEntry {
    return TimeEntry.restore(entity.id, entity.ownerId, {
      description: entity.description,
      projectId: entity.projectId,
      taskId: entity.taskId,
      routineId: entity.routineId,
      startedAt: new Date(entity.startedAt),
      endedAt: entity.endedAt ? new Date(entity.endedAt) : null,
      note: entity.note,
    });
  },

  toEntity(
    entry: TimeEntry,
    entity: TimeEntryEntity = new TimeEntryEntity(),
  ): TimeEntryEntity {
    const details = entry.details;
    entity.id = entry.id;
    entity.ownerId = entry.ownerId;
    entity.description = details.description;
    entity.projectId = details.projectId;
    entity.taskId = details.taskId;
    entity.routineId = details.routineId;
    entity.startedAt = details.startedAt;
    entity.endedAt = details.endedAt;
    entity.note = details.note;
    return entity;
  },
};
