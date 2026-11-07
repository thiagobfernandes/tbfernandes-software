import { IsoDate } from '../../../../common/domain';
import { Appointment } from './appointment';

export abstract class AppointmentRepository {
  abstract create(appointment: Appointment): Promise<Appointment>;
  abstract save(appointment: Appointment): Promise<Appointment>;
  abstract findById(ownerId: string, id: string): Promise<Appointment | null>;
  abstract findAll(ownerId: string): Promise<Appointment[]>;
  abstract findOnDay(ownerId: string, date: IsoDate): Promise<Appointment[]>;
  abstract delete(appointment: Appointment): Promise<void>;
}
