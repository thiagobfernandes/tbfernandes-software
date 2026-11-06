import { AppUser } from './app-user';

export abstract class AppUserRepository {
  abstract save(user: AppUser): Promise<AppUser>;
  abstract findById(id: string): Promise<AppUser | null>;
  abstract findByEmail(email: string): Promise<AppUser | null>;
}
