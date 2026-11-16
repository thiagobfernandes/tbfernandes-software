import {
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ApiBody, ApiHeader, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public, ValidatedBody } from '../../../common/decorators';
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
import { INGEST_KEY_HEADER, IngestKeyGuard } from './ingest-key.guard';

/**
 * PRS-03. Public route (no session or CSRF) for the prospecting worker, which runs on the
 * user's computer and proves itself with PROSPECTING_INGEST_KEY. Data goes to the configured
 * owner (TBF_AUTH_OWNER_ID).
 */
@ApiTags('prospecting')
@ApiHeader({ name: INGEST_KEY_HEADER, required: true })
@Public()
@UseGuards(IngestKeyGuard)
@Controller('webhooks/prospecting')
export class LeadIngestionController {
  private readonly ownerId: string;

  constructor(
    private readonly ingestion: LeadIngestionService,
    @Inject(prospectingConfig.KEY)
    config: ConfigType<typeof prospectingConfig>,
  ) {
    this.ownerId = config.ownerId;
  }

  @Put('leads/:externalId')
  @ApiBody({ type: LeadSyncRequest })
  async upsert(
    @Param('externalId') externalId: string,
    @ValidatedBody(leadSyncRequestSchema) body: ValidLeadSyncRequest,
  ): Promise<LeadResponse> {
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
    @Param('externalId') externalId: string,
    @ValidatedBody(leadMessageRequestSchema) body: ValidLeadMessageRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LeadMessageResponse> {
    const recorded = await this.ingestion.record(
      this.ownerId,
      externalId,
      body,
    );
    res.status(recorded.created ? 201 : 200);
    return LeadMapper.toMessageResponse(recorded.message);
  }

  @Get('summary')
  async summary(): Promise<ProspectingSummaryResponse> {
    return LeadMapper.toSummaryResponse(
      await this.ingestion.summary(this.ownerId),
    );
  }
}
