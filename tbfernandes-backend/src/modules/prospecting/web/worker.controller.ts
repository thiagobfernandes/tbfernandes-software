import { UseInterceptors } from '@nestjs/common';
import { ProspectingChangesInterceptor } from './prospecting-events';
import {
  Controller,
  Get,
  HttpCode,
  Inject,
  MessageEvent,
  Param,
  ParseUUIDPipe,
  Post,
  Sse,
  UseGuards,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ApiBody, ApiHeader, ApiTags } from '@nestjs/swagger';
import { interval, map, merge, Observable } from 'rxjs';
import { Public, ValidatedBody } from '../../../common/decorators';
import { InvalidArgumentError } from '../../../common/domain';
import { prospectingConfig } from '../../../infrastructure/environments/registers';
import { SendRequestService } from '../application/send-request.service';
import { InMemoryWorkerChannel } from '../infrastructure/channel/in-memory-worker-channel';
import {
  SendAskRequest,
  sendAskRequestSchema,
  SendRequestMapper,
  SendRequestResponse,
  SendResultRequest,
  sendResultRequestSchema,
  WorkerSendRequestResponse,
} from '../protocols';
import type { ValidSendAskRequest, ValidSendResultRequest } from '../protocols';
import { INGEST_KEY_HEADER, IngestKeyGuard } from './ingest-key.guard';

/** Proxies drop a quiet connection; a comment line keeps it open. */
const HEARTBEAT_MS = 25_000;

const RequestIdParam = () =>
  Param(
    'id',
    new ParseUUIDPipe({
      exceptionFactory: () =>
        new InvalidArgumentError('id precisa ser um UUID'),
    }),
  );

/**
 * PRS-05. The worker asks to send, learns what is ready and reports back. It keeps
 * GET /events open (Server-Sent Events) to hear an approval at once.
 */
@ApiTags('prospecting')
@ApiHeader({ name: INGEST_KEY_HEADER, required: true })
@Public()
@UseGuards(IngestKeyGuard)
@UseInterceptors(ProspectingChangesInterceptor)
@Controller('webhooks/prospecting')
export class WorkerController {
  private readonly ownerId: string;

  constructor(
    private readonly sends: SendRequestService,
    private readonly channel: InMemoryWorkerChannel,
    @Inject(prospectingConfig.KEY)
    config: ConfigType<typeof prospectingConfig>,
  ) {
    this.ownerId = config.ownerId;
  }

  @Sse('events')
  events(): Observable<MessageEvent> {
    const heartbeat = interval(HEARTBEAT_MS).pipe(
      map((): MessageEvent => ({ type: 'ping', data: {} })),
    );
    const events = this.channel
      .stream(this.ownerId)
      .pipe(map((event): MessageEvent => ({ type: event.type, data: event })));
    return merge(events, heartbeat);
  }

  @Post('leads/:externalId/send-requests')
  @HttpCode(200)
  @ApiBody({ type: SendAskRequest })
  async ask(
    @Param('externalId') externalId: string,
    @ValidatedBody(sendAskRequestSchema) body: ValidSendAskRequest,
  ): Promise<WorkerSendRequestResponse> {
    const { request, lead } = await this.sends.ask(
      this.ownerId,
      externalId,
      body.stage,
      body.body,
    );
    return SendRequestMapper.toWorkerResponse(request, lead);
  }

  @Get('send-requests/ready')
  async ready(): Promise<WorkerSendRequestResponse[]> {
    return (await this.sends.ready(this.ownerId)).map(({ request, lead }) =>
      SendRequestMapper.toWorkerResponse(request, lead),
    );
  }

  @Post('send-requests/:id/claim')
  @HttpCode(200)
  async claim(
    @RequestIdParam() id: string,
  ): Promise<WorkerSendRequestResponse> {
    const { request, lead } = await this.sends.claim(this.ownerId, id);
    return SendRequestMapper.toWorkerResponse(request, lead);
  }

  @Post('send-requests/:id/result')
  @HttpCode(200)
  @ApiBody({ type: SendResultRequest })
  async result(
    @RequestIdParam() id: string,
    @ValidatedBody(sendResultRequestSchema) body: ValidSendResultRequest,
  ): Promise<SendRequestResponse> {
    return SendRequestMapper.toResponse(
      await this.sends.finish(this.ownerId, id, body.sent, body.error),
    );
  }
}
