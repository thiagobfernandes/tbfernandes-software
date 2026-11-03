import { Injectable } from '@nestjs/common';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { AppUser, AppUserRepository } from '../../domain';
import { AppUserEntity } from './app-user.entity';
import { AppUserPersistenceMapper } from './mappers/app-user.persistence-mapper';

@Injectable()
export class TypeOrmAppUserRepository extends AppUserRepository {
  constructor(private readonly tx: TransactionalManager) {
    super();
  }

  private get users() {
    return this.tx.manager.getRepository(AppUserEntity);
  }

  async save(user: AppUser): Promise<AppUser> {
    const existing = await this.users.findOneBy({ id: user.id });
    const saved = await this.users.save(
      AppUserPersistenceMapper.toEntity(user, existing ?? undefined),
    );
    return AppUserPersistenceMapper.toDomain(saved);
  }

  async findById(id: string): Promise<AppUser | null> {
    const entity = await this.users.findOneBy({ id });
    return entity && AppUserPersistenceMapper.toDomain(entity);
  }

  async findByEmail(email: string): Promise<AppUser | null> {
    const entity = await this.users.findOneBy({
      email: email.trim().toLowerCase(),
    });
    return entity && AppUserPersistenceMapper.toDomain(entity);
  }
}
