import { UseInterceptors } from '@nestjs/common';
import { ProspectingChangesInterceptor } from './prospecting-events';
import { Controller, Get, Post, Put, Res } from '@nestjs/common';
import type { Response } from 'express';
import { created } from '../../../common/web/created';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  IdParam,
  ValidatedBody,
  ValidatedQuery,
} from '../../../common/decorators';
import { SendRequestService } from '../application/send-request.service';
import {
  ManualSendRequest,
  manualSendRequestSchema,
  SendDecisionRequest,
  sendDecisionRequestSchema,
  sendRequestListQuerySchema,
  SendRequestMapper,
  SendRequestResponse,
  WorkerPresenceResponse,
} from '../protocols';
import type {
  ValidManualSendRequest,
  SendRequestListQuery,
  ValidSendDecisionRequest,
} from '../protocols';

@ApiTags('prospecting')
@UseInterceptors(ProspectingChangesInterceptor)
@Controller('prospecting')
export class SendRequestController {
  constructor(private readonly sends: SendRequestService) {}

  @Get('send-requests')
  @ApiQuery({ name: 'status', required: false })
  async list(
    @ValidatedQuery(sendRequestListQuerySchema) query: SendRequestListQuery,
  ): Promise<SendRequestResponse[]> {
    return (await this.sends.list(query.status)).map((request) =>
      SendRequestMapper.toResponse(request),
    );
  }

  /** RF-PRS-06: `{ leadId, body }`, sent by the worker as soon as it is connected. */
  @Post('send-requests')
  @ApiBody({ type: ManualSendRequest })
  async sendManual(
    @ValidatedBody(manualSendRequestSchema) body: ValidManualSendRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SendRequestResponse> {
    const request = await this.sends.sendManual(body.leadId, body.body);
    return created(
      res,
      'prospecting/send-requests',
      SendRequestMapper.toResponse(request),
    );
  }

  /** `{ status: "approved" }` sends now; `{ status: "cancelled" }` never sends it (RN-37). */
  @Put('send-requests/:id')
  @ApiBody({ type: SendDecisionRequest })
  async decide(
    @IdParam() id: string,
    @ValidatedBody(sendDecisionRequestSchema) body: ValidSendDecisionRequest,
  ): Promise<SendRequestResponse> {
    return SendRequestMapper.toResponse(
      await this.sends.decide(id, body.status),
    );
  }

  @Get('worker')
  worker(): WorkerPresenceResponse {
    return SendRequestMapper.toPresenceResponse(this.sends.presence());
  }
}
