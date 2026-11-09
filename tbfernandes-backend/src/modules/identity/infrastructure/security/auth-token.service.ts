import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Request, Response } from 'express';
import { authConfig } from '../../../../infrastructure/environments/registers';
import { AUTH_COOKIE, AuthTokenPayload } from './auth-token';

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
  ) {}

  issue(res: Response, ownerId: string): void {
    const payload: AuthTokenPayload = { sub: ownerId };
    res.cookie(AUTH_COOKIE, this.jwt.sign(payload), {
      ...this.cookieOptions(),
      maxAge: this.config.jwtTtlSeconds * 1000,
    });
  }

  clear(res: Response): void {
    res.clearCookie(AUTH_COOKIE, this.cookieOptions());
  }

  ownerIdFrom(req: Request): string | null {
    const token = (req.cookies as Record<string, string | undefined>)?.[
      AUTH_COOKIE
    ];
    if (!token) return null;
    try {
      return this.jwt.verify<AuthTokenPayload>(token).sub;
    } catch {
      return null;
    }
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.cookieSecure,
      domain: this.config.cookieDomain,
      path: '/',
    };
  }
}
