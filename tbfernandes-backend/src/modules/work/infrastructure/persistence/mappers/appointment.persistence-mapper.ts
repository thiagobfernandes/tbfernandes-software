import { Appointment } from '../../../domain';
import { AppointmentEntity } from '../appointment.entity';

export const AppointmentPersistenceMapper = {
  toDomain(entity: AppointmentEntity): Appointment {
    return Appointment.restore(entity.id, entity.ownerId, {
      title: entity.title,
      date: entity.day,
      startTime: entity.startTime,
      endTime: entity.endTime,
      taskId: entity.taskId,
      note: entity.note,
    });
  },

  toEntity(
    appointment: Appointment,
    entity: AppointmentEntity = new AppointmentEntity(),
  ): AppointmentEntity {
    const details = appointment.details;
    entity.id = appointment.id;
    entity.ownerId = appointment.ownerId;
    entity.title = details.title;
    entity.day = details.date;
    entity.startTime = details.startTime;
    entity.endTime = details.endTime;
    entity.taskId = details.taskId;
    entity.note = details.note;
    return entity;
  },
};
