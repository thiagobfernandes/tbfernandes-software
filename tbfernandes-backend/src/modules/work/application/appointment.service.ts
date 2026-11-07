import { Injectable } from '@nestjs/common';
import {
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import { NotFoundError } from '../../../common/domain';
import {
  Appointment,
  AppointmentDetails,
  AppointmentRepository,
  TaskRepository,
} from '../domain';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly tasks: TaskRepository,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly uow: UnitOfWork,
  ) {}

  create(details: AppointmentDetails): Promise<Appointment> {
    return this.uow.run(async () => {
      const ownerId = this.owner.currentOwnerId();
      const appointment = Appointment.create(
        this.ids.forNewAggregate(),
        ownerId,
        details,
      );
      await this.checkTask(ownerId, details.taskId);
      appointment.ensureNoOverlap(
        await this.appointments.findOnDay(ownerId, appointment.details.date),
      );
      return this.appointments.create(appointment);
    });
  }

  update(id: string, details: AppointmentDetails): Promise<Appointment> {
    return this.uow.run(async () => {
      const appointment = await this.get(id);
      appointment.update(details);
      await this.checkTask(appointment.ownerId, details.taskId);
      appointment.ensureNoOverlap(
        await this.appointments.findOnDay(
          appointment.ownerId,
          appointment.details.date,
        ),
      );
      return this.appointments.save(appointment);
    });
  }

  delete(id: string): Promise<void> {
    return this.uow.run(async () =>
      this.appointments.delete(await this.get(id)),
    );
  }

  async get(id: string): Promise<Appointment> {
    const appointment = await this.appointments.findById(
      this.owner.currentOwnerId(),
      id,
    );
    if (!appointment) throw new NotFoundError('O agendamento', id);
    return appointment;
  }

  list(): Promise<Appointment[]> {
    return this.appointments.findAll(this.owner.currentOwnerId());
  }

  private async checkTask(
    ownerId: string,
    taskId: string | null,
  ): Promise<void> {
    if (taskId != null && !(await this.tasks.findById(ownerId, taskId)))
      throw new NotFoundError('A tarefa', taskId);
  }
}
