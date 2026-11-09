import { Injectable } from '@nestjs/common';
import { UnauthenticatedError } from '../../../common/domain';
import { AppUserRepository } from '../domain';
import { PasswordHasher } from './password-hasher';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly users: AppUserRepository,
    private readonly passwords: PasswordHasher,
  ) {}

  /** Same answer for unknown e-mail and wrong password, so accounts cannot be probed. */
  async authenticate(email: string, password: string): Promise<string> {
    const user = await this.users.findByEmail(email);
    const ok =
      !!user &&
      user.canLogIn() &&
      (await this.passwords.matches(password, user.passwordHash!));
    if (!ok) throw new UnauthenticatedError('E-mail ou senha incorretos');
    return user.id;
  }
}
