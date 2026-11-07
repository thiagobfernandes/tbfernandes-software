import { Injectable } from '@nestjs/common';
import { IsoDate } from '../../../../common/domain';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { Appointment, AppointmentRepository } from '../../domain';
import { AppointmentEntity } from './appointment.entity';
import { AppointmentPersistenceMapper as Mapper } from './mappers/appointment.persistence-mapper';

@Injectable()
export class TypeOrmAppointmentRepository extends AppointmentRepository {
  private readonly rows: BaseRepository<AppointmentEntity>;

  constructor(tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(AppointmentEntity, tx);
  }

  async create(appointment: Appointment): Promise<Appointment> {
    await this.rows.insertEntity(Mapper.toEntity(appointment));
    return appointment;
  }

  async save(appointment: Appointment): Promise<Appointment> {
    const existing = await this.rows.findOwned(
      appointment.ownerId,
      appointment.id,
    );
    return Mapper.toDomain(
      await this.rows.saveEntity(
        Mapper.toEntity(appointment, existing ?? undefined),
      ),
    );
  }

  async findById(ownerId: string, id: string): Promise<Appointment | null> {
    const entity = await this.rows.findOwned(ownerId, id);
    return entity && Mapper.toDomain(entity);
  }

  async findAll(ownerId: string): Promise<Appointment[]> {
    const rows = await this.rows.findAllOwned(ownerId, {
      order: { day: 'ASC', startTime: 'ASC' },
    });
    return rows.map((row) => Mapper.toDomain(row));
  }

  async findOnDay(ownerId: string, date: IsoDate): Promise<Appointment[]> {
    const rows = await this.rows.findAllOwned(ownerId, {
      where: { day: date },
      order: { startTime: 'ASC' },
    });
    return rows.map((row) => Mapper.toDomain(row));
  }

  delete(appointment: Appointment): Promise<void> {
    return this.rows.deleteOwned(appointment.ownerId, appointment.id);
  }
}
