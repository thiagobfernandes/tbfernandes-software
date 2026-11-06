import { Controller, Delete, Get, HttpCode, Post, Res } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { IdParam, ValidatedBody } from '../../../common/decorators';
import { created } from '../../../common/web/created';
import { OpenFinanceService } from '../application/open-finance.service';
import {
  AvailabilityResponse,
  ConnectionMapper,
  ConnectionResponse,
  ConnectTokenResponse,
  RegisterRequest,
  registerRequestSchema,
  SyncResponse,
  TokenRequest,
  tokenRequestSchema,
} from '../protocols';
import type { ValidRegisterRequest, ValidTokenRequest } from '../protocols';

@ApiTags('finance')
@Controller('finance/connections')
export class ConnectionController {
  constructor(private readonly openFinance: OpenFinanceService) {}

  @Get('availability')
  availability(): AvailabilityResponse {
    return { enabled: this.openFinance.enabled() };
  }

  @Get()
  async list(): Promise<ConnectionResponse[]> {
    return (await this.openFinance.connections()).map((connection) =>
      ConnectionMapper.toResponse(connection),
    );
  }

  @Post('token')
  @HttpCode(200)
  @ApiBody({ type: TokenRequest })
  async token(
    @ValidatedBody(tokenRequestSchema) body: ValidTokenRequest,
  ): Promise<ConnectTokenResponse> {
    const token = await this.openFinance.connectToken(body.scope);
    return { accessToken: token.accessToken, itemId: null };
  }

  @Post(':id/token')
  @HttpCode(200)
  async reconnectToken(@IdParam() id: string): Promise<ConnectTokenResponse> {
    const token = await this.openFinance.reconnectToken(id);
    return { accessToken: token.accessToken, itemId: token.connectionId };
  }

  @Post()
  @ApiBody({ type: RegisterRequest })
  async register(
    @ValidatedBody(registerRequestSchema) body: ValidRegisterRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ConnectionResponse> {
    const connection = await this.openFinance.register(body.itemId, body.scope);
    return created(
      res,
      'finance/connections',
      ConnectionMapper.toResponse(connection),
    );
  }

  @Post(':id/sync')
  @HttpCode(200)
  async sync(@IdParam() id: string): Promise<SyncResponse> {
    const result = await this.openFinance.sync(id);
    return {
      imported: result.imported,
      connection: ConnectionMapper.toResponse(result.connection),
    };
  }

  @Delete(':id')
  @HttpCode(204)
  async disconnect(@IdParam() id: string): Promise<void> {
    await this.openFinance.disconnect(id);
  }
}
