import { AppUser } from '../../../domain';
import { AppUserEntity } from '../app-user.entity';

export const AppUserPersistenceMapper = {
  toDomain(entity: AppUserEntity): AppUser {
    return AppUser.restore(
      entity.id,
      {
        name: entity.name,
        email: entity.email,
        locale: entity.locale,
        timeZone: entity.timeZone,
      },
      entity.passwordHash,
    );
  },

  /** Copies the user onto a new or loaded row (keeps its version and timestamps). */
  toEntity(
    user: AppUser,
    entity: AppUserEntity = new AppUserEntity(),
  ): AppUserEntity {
    entity.id = user.id;
    entity.name = user.profile.name;
    entity.email = user.profile.email;
    entity.locale = user.profile.locale ?? 'pt-BR';
    entity.timeZone = user.profile.timeZone ?? 'America/Sao_Paulo';
    entity.passwordHash = user.passwordHash;
    return entity;
  },
};
