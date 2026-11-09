import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthenticationService } from '../../application/authentication.service';
import { AuthenticatedUser } from './auth-token';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authentication: AuthenticationService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string): Promise<AuthenticatedUser> {
    const ownerId = await this.authentication.authenticate(
      email.trim(),
      password,
    );
    return { ownerId };
  }
}
