import {
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from '../../../common/decorators';
import { authConfig } from '../../../infrastructure/environments/registers';
import { AuthTokenService } from '../infrastructure/security/auth-token.service';
import { LocalAuthGuard } from '../infrastructure/security/local-auth.guard';
import { LoginThrottlerGuard } from '../infrastructure/security/login-throttler.guard';
import { LoginRequest, SessionResponse } from '../protocols';

@ApiTags('identity')
@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly tokens: AuthTokenService,
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
  ) {}

  @Get('session')
  session(@Req() req: Request): SessionResponse {
    return {
      mode: this.config.mode,
      signedIn: this.tokens.ownerIdFrom(req) !== null,
    };
  }

  @Post('login')
  @HttpCode(204)
  @ApiBody({ type: LoginRequest })
  @UseGuards(LoginThrottlerGuard, LocalAuthGuard)
  login(@Req() req: Request, @Res({ passthrough: true }) res: Response): void {
    this.tokens.issue(res, req.user!.ownerId);
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response): void {
    this.tokens.clear(res);
  }
}
