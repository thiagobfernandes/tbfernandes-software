import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { authConfig } from '../../../../infrastructure/environments/registers';
import { AUTH_COOKIE, AuthenticatedUser, AuthTokenPayload } from './auth-token';

function fromCookie(req: Request): string | null {
  const cookies = req.cookies as Record<string, string | undefined>;
  return cookies?.[AUTH_COOKIE] ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(authConfig.KEY)
    config: ConfigType<typeof authConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([fromCookie]),
      secretOrKey: config.jwtSecret,
      algorithms: ['HS256'],
      ignoreExpiration: false,
    });
  }

  validate(payload: AuthTokenPayload): AuthenticatedUser {
    return { ownerId: payload.sub };
  }
}
