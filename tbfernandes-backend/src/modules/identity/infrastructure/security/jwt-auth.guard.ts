import { ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC } from '../../../../common/decorators';
import { UnauthenticatedError } from '../../../../common/domain';
import { authConfig } from '../../../../infrastructure/environments/registers';
import { AuthenticatedUser } from './auth-token';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (this.config.mode !== 'session') return true;
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest<TUser = AuthenticatedUser>(
    _error: unknown,
    user: TUser | false,
  ): TUser {
    if (!user) throw new UnauthenticatedError();
    return user;
  }
}
