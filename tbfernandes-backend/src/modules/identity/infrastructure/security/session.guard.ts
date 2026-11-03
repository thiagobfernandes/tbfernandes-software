import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC } from '../../../../common/decorators';
import { UnauthenticatedError } from '../../../../common/domain';
import { authConfig } from '../../../../infrastructure/environments/registers';
import './session';

/** Session mode: every route not marked @Public() needs a signed-in account (401 otherwise). */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.config.mode !== 'session') return true;
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    if (context.switchToHttp().getRequest<Request>().session?.ownerId)
      return true;
    throw new UnauthenticatedError();
  }
}
