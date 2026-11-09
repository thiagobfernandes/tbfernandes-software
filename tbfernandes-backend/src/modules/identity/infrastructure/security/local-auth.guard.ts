import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvalidCredentialsError } from '../../domain';
import { AuthenticatedUser } from './auth-token';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  handleRequest<TUser = AuthenticatedUser>(
    error: unknown,
    user: TUser | false,
  ): TUser {
    if (error instanceof Error) throw error;
    if (!user) throw new InvalidCredentialsError();
    return user;
  }
}
