import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { Interaction, InteractionRepository } from '../../domain';
import { InteractionEntity } from './interaction.entity';
import { InteractionPersistenceMapper as Mapper } from './mappers/interaction.persistence-mapper';

@Injectable()
export class TypeOrmInteractionRepository extends InteractionRepository {
  private readonly rows: BaseRepository<InteractionEntity>;

  constructor(tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(InteractionEntity, tx);
  }

  async create(interaction: Interaction): Promise<Interaction> {
    await this.rows.insertEntity(Mapper.toEntity(interaction));
    return interaction;
  }

  async save(interaction: Interaction): Promise<Interaction> {
    const existing = await this.rows.findOwned(
      interaction.ownerId,
      interaction.id,
    );
    return Mapper.toDomain(
      await this.rows.saveEntity(
        Mapper.toEntity(interaction, existing ?? undefined),
      ),
    );
  }

  async findById(ownerId: string, id: string): Promise<Interaction | null> {
    const entity = await this.rows.findOwned(ownerId, id);
    return entity && Mapper.toDomain(entity);
  }

  async findAll(
    ownerId: string,
    contactId: string | null,
  ): Promise<Interaction[]> {
    const rows = await this.rows.findAllOwned(ownerId, {
      where: contactId ? { contactId } : {},
      order: { occurredOn: 'DESC' },
    });
    return rows.map((row) => Mapper.toDomain(row));
  }

  async findByFollowUpTask(
    ownerId: string,
    taskId: string,
  ): Promise<Interaction[]> {
    const rows = await this.rows.findAllOwned(ownerId, {
      where: { followUpTaskId: taskId },
    });
    return rows.map((row) => Mapper.toDomain(row));
  }

  delete(interaction: Interaction): Promise<void> {
    return this.rows.deleteOwned(interaction.ownerId, interaction.id);
  }
}
