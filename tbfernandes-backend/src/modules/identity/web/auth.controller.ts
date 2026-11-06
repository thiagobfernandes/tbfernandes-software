import { Controller, Get, HttpCode, Inject, Post, Req } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { promisify } from 'node:util';
import { Public, ValidatedBody } from '../../../common/decorators';
import { authConfig } from '../../../infrastructure/environments/registers';
import { AuthenticationService } from '../application/authentication.service';
import { SESSION_COOKIE } from '../infrastructure/security/session';
import {
  LoginRequest,
  loginRequestSchema,
  SessionResponse,
} from '../protocols';

@ApiTags('identity')
@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authentication: AuthenticationService,
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
  ) {}

  /** Tells the frontend whether to show the login screen; the CSRF cookie goes with it. */
  @Get('session')
  session(@Req() req: Request): SessionResponse {
    return { mode: this.config.mode, signedIn: !!req.session?.ownerId };
  }

  @Post('login')
  @HttpCode(204)
  async login(
    @Req() req: Request,
    @ValidatedBody(loginRequestSchema) body: LoginRequest,
  ): Promise<void> {
    const ownerId = await this.authentication.authenticate(
      body.email,
      body.password,
    );
    // Session fixation: signing in always starts a new session id.
    await promisify(req.session.regenerate.bind(req.session))();
    req.session.ownerId = ownerId;
    await promisify(req.session.save.bind(req.session))();
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request): Promise<void> {
    await new Promise<void>((resolve) => req.session.destroy(() => resolve()));
    req.res?.clearCookie(SESSION_COOKIE, { path: '/' });
  }
}
