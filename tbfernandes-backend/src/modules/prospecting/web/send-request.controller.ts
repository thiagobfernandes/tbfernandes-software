import { UseInterceptors } from '@nestjs/common';
import { ProspectingChangesInterceptor } from './prospecting-events';
import { Controller, Get, Put } from '@nestjs/common';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  IdParam,
  ValidatedBody,
  ValidatedQuery,
} from '../../../common/decorators';
import { SendRequestService } from '../application/send-request.service';
import {
  SendDecisionRequest,
  sendDecisionRequestSchema,
  sendRequestListQuerySchema,
  SendRequestMapper,
  SendRequestResponse,
  WorkerPresenceResponse,
} from '../protocols';
import type {
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
