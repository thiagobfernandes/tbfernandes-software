/** One-way password hashing. Implemented in infrastructure/security. */
export abstract class PasswordHasher {
  abstract hash(password: string): Promise<string>;
  abstract matches(password: string, hash: string): Promise<boolean>;
}
