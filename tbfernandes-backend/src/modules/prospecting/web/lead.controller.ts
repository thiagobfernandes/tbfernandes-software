import { Controller, Delete, Get, HttpCode, Put } from '@nestjs/common';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  IdParam,
  ValidatedBody,
  ValidatedQuery,
} from '../../../common/decorators';
import { LeadService } from '../application/lead.service';
import {
  leadListQuerySchema,
  LeadMapper,
  leadMessageListQuerySchema,
  LeadMessageResponse,
  LeadResponse,
  LeadReviewRequest,
  leadReviewRequestSchema,
  ProspectingSummaryResponse,
} from '../protocols';
import type {
  LeadListQuery,
  LeadMessageListQuery,
  ValidLeadReviewRequest,
} from '../protocols';

@ApiTags('prospecting')
@Controller('prospecting')
export class LeadController {
  constructor(private readonly leads: LeadService) {}

  @Get('leads')
  @ApiQuery({ name: 'status', required: false })
  async list(
    @ValidatedQuery(leadListQuerySchema) query: LeadListQuery,
  ): Promise<LeadResponse[]> {
    return (await this.leads.list(query.status)).map((lead) =>
      LeadMapper.toResponse(lead),
    );
  }

  @Get('leads/:id')
  async get(@IdParam() id: string): Promise<LeadResponse> {
    return LeadMapper.toResponse(await this.leads.get(id));
  }

  @Put('leads/:id')
  @ApiBody({ type: LeadReviewRequest })
  async review(
    @IdParam() id: string,
    @ValidatedBody(leadReviewRequestSchema) body: ValidLeadReviewRequest,
  ): Promise<LeadResponse> {
    return LeadMapper.toResponse(
      await this.leads.review(id, body.status, body.notes),
    );
  }

  @Delete('leads/:id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.leads.delete(id);
  }

  @Get('messages')
  @ApiQuery({ name: 'leadId', required: false })
  async messages(
    @ValidatedQuery(leadMessageListQuerySchema) query: LeadMessageListQuery,
  ): Promise<LeadMessageResponse[]> {
    return (await this.leads.messagesOf(query.leadId)).map((message) =>
      LeadMapper.toMessageResponse(message),
    );
  }

  @Get('summary')
  async summary(): Promise<ProspectingSummaryResponse> {
    return LeadMapper.toSummaryResponse(await this.leads.summary());
  }
}
