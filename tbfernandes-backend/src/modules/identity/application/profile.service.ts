import { Injectable } from '@nestjs/common';
import { OwnerContext, UnitOfWork } from '../../../common/application';
import {
  BusinessRuleViolationError,
  NotFoundError,
} from '../../../common/domain';
import { AppUser, AppUserRepository, checkPassword, Profile } from '../domain';
import { PasswordHasher } from './password-hasher';

/** The signed-in user's own account (IDN-03). */
@Injectable()
export class ProfileService {
  constructor(
    private readonly users: AppUserRepository,
    private readonly owner: OwnerContext,
    private readonly passwords: PasswordHasher,
    private readonly uow: UnitOfWork,
  ) {}

  async me(): Promise<AppUser> {
    const id = this.owner.currentOwnerId();
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundError('A conta', id);
    return user;
  }

  updateProfile(profile: Profile): Promise<AppUser> {
    return this.uow.run(async () => {
      const user = await this.me();
      user.updateProfile(profile);
      return this.users.save(user);
    });
  }

  /** RN-25: the current password is required, and the new one has at least 12 characters. */
  changePassword(current: string | null, next: string | null): Promise<void> {
    return this.uow.run(async () => {
      const user = await this.me();
      if (
        user.canLogIn() &&
        (!current ||
          !(await this.passwords.matches(current, user.passwordHash!)))
      ) {
        throw new BusinessRuleViolationError(
          'RN-25',
          'A senha atual está errada',
        );
      }
      user.changePasswordHash(await this.passwords.hash(checkPassword(next)));
      await this.users.save(user);
    });
  }
}
