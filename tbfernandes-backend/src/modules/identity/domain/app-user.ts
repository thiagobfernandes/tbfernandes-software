import { InvalidArgumentError, Require } from '../../../common/domain';

export interface Profile {
  name: string;
  email: string;
  locale: string | null;
  timeZone: string | null;
}

const EMAIL = /^[^@\s]+@[^@\s]+$/;

function isTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** The account that owns the data. Holds only a password hash, never the password. */
export class AppUser {
  private constructor(
    readonly id: string,
    private _profile: Profile,
    private _passwordHash: string | null,
  ) {}

  static create(id: string, profile: Profile): AppUser {
    return new AppUser(
      Require.present(id, 'id'),
      AppUser.validated(profile),
      null,
    );
  }

  static restore(
    id: string,
    profile: Profile,
    passwordHash: string | null,
  ): AppUser {
    return new AppUser(id, profile, passwordHash);
  }

  get profile(): Profile {
    return this._profile;
  }

  get passwordHash(): string | null {
    return this._passwordHash;
  }

  updateProfile(profile: Profile): void {
    this._profile = AppUser.validated(profile);
  }

  changePasswordHash(hash: string): void {
    this._passwordHash = Require.text(hash, 'passwordHash', 100);
  }

  canLogIn(): boolean {
    return this._passwordHash !== null;
  }

  private static validated(profile: Profile): Profile {
    const email = Require.text(profile.email, 'email', 254).toLowerCase();
    if (!EMAIL.test(email))
      throw new InvalidArgumentError('email não é válido');
    const timeZone = profile.timeZone ?? 'America/Sao_Paulo';
    if (!isTimeZone(timeZone))
      throw new InvalidArgumentError('timeZone não é um fuso horário válido');
    return {
      name: Require.text(profile.name, 'name', 120),
      email,
      locale: profile.locale ?? 'pt-BR',
      timeZone,
    };
  }
}
