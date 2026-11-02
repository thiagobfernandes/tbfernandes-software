import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PasswordHasher } from '../../application/password-hasher';

/** Prefix of the hashes the database already holds ("{bcrypt}$2a$10$..."). */
const PREFIX = '{bcrypt}';
const ROUNDS = 10;

/** BCrypt, in the "{bcrypt}<hash>" format, so existing passwords keep working. */
@Injectable()
export class BcryptPasswordHasher extends PasswordHasher {
  async hash(password: string): Promise<string> {
    return PREFIX + (await bcrypt.hash(password, ROUNDS));
  }

  async matches(password: string, hash: string): Promise<boolean> {
    const raw = hash.startsWith(PREFIX) ? hash.slice(PREFIX.length) : hash;
    if (!raw.startsWith('$2')) return false;
    return bcrypt.compare(password, raw);
  }
}
