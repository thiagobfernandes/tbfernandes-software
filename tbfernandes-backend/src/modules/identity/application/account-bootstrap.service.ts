import { Injectable } from '@nestjs/common';
import { IdGenerator, UnitOfWork } from '../../../common/application';
import { AppUser, AppUserRepository, checkPassword } from '../domain';
import { PasswordHasher } from './password-hasher';

export interface BootstrapAccount {
  email: string;
  password: string;
  name: string;
  resetPassword?: boolean;
}

/**
 * Creates the owner account at startup, or gives an existing one a password, when
 * TBF_AUTH_BOOTSTRAP_EMAIL and _PASSWORD are set. There is no public sign-up, so
 * TBF_AUTH_BOOTSTRAP_RESET_PASSWORD is also how a forgotten password is replaced.
 */
@Injectable()
export class AccountBootstrapService {
  constructor(
    private readonly users: AppUserRepository,
    private readonly passwords: PasswordHasher,
    private readonly ids: IdGenerator,
    private readonly uow: UnitOfWork,
  ) {}

  bootstrap(
    account: BootstrapAccount,
    ownerId: string,
  ): Promise<'created' | 'password-set' | 'unchanged'> {
    return this.uow.run(async () => {
      let user = await this.users.findByEmail(account.email);
      let result: 'created' | 'password-set' | 'unchanged' = 'unchanged';
      if (!user) {
        const id = (await this.users.findById(ownerId))
          ? this.ids.newId()
          : ownerId;
        user = AppUser.create(id, {
          name: account.name || account.email,
          email: account.email,
          locale: null,
          timeZone: null,
        });
        result = 'created';
      }
      if (await this.needsPassword(user, account)) {
        user.changePasswordHash(
          await this.passwords.hash(checkPassword(account.password)),
        );
        if (result === 'unchanged') result = 'password-set';
      }
      await this.users.save(user);
      return result;
    });
  }

  private async needsPassword(
    user: AppUser,
    account: BootstrapAccount,
  ): Promise<boolean> {
    if (!user.canLogIn()) return true;
    if (!account.resetPassword) return false;
    return !(await this.passwords.matches(
      account.password,
      user.passwordHash!,
    ));
  }
}
