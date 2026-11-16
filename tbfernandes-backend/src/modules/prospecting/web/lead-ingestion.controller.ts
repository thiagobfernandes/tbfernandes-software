import {
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { Public, ValidatedBody } from '../../../common/decorators';
import { UnauthenticatedError } from '../../../common/domain';
import { prospectingConfig } from '../../../infrastructure/environments/registers';
import { LeadIngestionService } from '../application/lead-ingestion.service';
import {
  LeadMapper,
  LeadMessageRequest,
  leadMessageRequestSchema,
  LeadMessageResponse,
  LeadResponse,
  LeadSyncRequest,
  leadSyncRequestSchema,
  ProspectingSummaryResponse,
} from '../protocols';
import type {
  ValidLeadMessageRequest,
  ValidLeadSyncRequest,
} from '../protocols';

export const INGEST_KEY_HEADER = 'x-ingest-key';

/**
 * PRS-03. Public route (no session or CSRF) for the prospecting worker, which runs on the
 * user's computer. It proves itself with PROSPECTING_INGEST_KEY; without a configured key
 * every call is refused. Data goes to the configured owner (TBF_AUTH_OWNER_ID).
 */
@ApiTags('prospecting')
@Public()
@Controller('webhooks/prospecting')
export class LeadIngestionController {
  private readonly key: Buffer;
  private readonly ownerId: string;

  constructor(
    private readonly ingestion: LeadIngestionService,
    @Inject(prospectingConfig.KEY)
    config: ConfigType<typeof prospectingConfig>,
  ) {
    this.key = Buffer.from(config.ingestKey, 'utf8');
    this.ownerId = config.ownerId;
  }

  @Put('leads/:externalId')
  @ApiBody({ type: LeadSyncRequest })
  async upsert(
    @Headers(INGEST_KEY_HEADER) key: string | undefined,
    @Param('externalId') externalId: string,
    @ValidatedBody(leadSyncRequestSchema) body: ValidLeadSyncRequest,
  ): Promise<LeadResponse> {
    this.authenticate(key);
    return LeadMapper.toResponse(
      await this.ingestion.upsert(
        this.ownerId,
        LeadMapper.toSource(externalId, body),
      ),
    );
  }

  @Post('leads/:externalId/messages')
  @ApiBody({ type: LeadMessageRequest })
  async record(
    @Headers(INGEST_KEY_HEADER) key: string | undefined,
    @Param('externalId') externalId: string,
    @ValidatedBody(leadMessageRequestSchema) body: ValidLeadMessageRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LeadMessageResponse> {
    this.authenticate(key);
    const recorded = await this.ingestion.record(
      this.ownerId,
      externalId,
      body,
    );
    res.status(recorded.created ? 201 : 200);
    return LeadMapper.toMessageResponse(recorded.message);
  }

  @Get('summary')
  async summary(
    @Headers(INGEST_KEY_HEADER) key: string | undefined,
  ): Promise<ProspectingSummaryResponse> {
    this.authenticate(key);
    return LeadMapper.toSummaryResponse(
      await this.ingestion.summary(this.ownerId),
    );
  }

  private authenticate(received: string | undefined): void {
    const given = Buffer.from(received ?? '', 'utf8');
    const valid =
      this.key.length > 0 &&
      given.length === this.key.length &&
      timingSafeEqual(given, this.key);
    if (!valid) throw new UnauthenticatedError('Chave de ingestão inválida');
  }
}
