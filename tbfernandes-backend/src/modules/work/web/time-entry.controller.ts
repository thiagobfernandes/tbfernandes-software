import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Clock } from '../../../common/application';
import { IdParam, ValidatedBody } from '../../../common/decorators';
import { created } from '../../../common/web/created';
import { TimeEntryService } from '../application/time-entry.service';
import {
  TimeEntryMapper,
  TimeEntryRequest,
  timeEntryRequestSchema,
  TimeEntryResponse,
} from '../protocols';
import type { ValidTimeEntryRequest } from '../protocols';

@ApiTags('work')
@Controller('time-entries')
export class TimeEntryController {
  constructor(
    private readonly entries: TimeEntryService,
    private readonly clock: Clock,
  ) {}

  @Get()
  async list(): Promise<TimeEntryResponse[]> {
    const now = this.clock.now();
    return (await this.entries.list()).map((entry) =>
      TimeEntryMapper.toResponse(entry, now),
    );
  }

  @Get(':id')
  async get(@IdParam() id: string): Promise<TimeEntryResponse> {
    return TimeEntryMapper.toResponse(
      await this.entries.get(id),
      this.clock.now(),
    );
  }

  @Post()
  @ApiBody({ type: TimeEntryRequest })
  async create(
    @ValidatedBody(timeEntryRequestSchema) body: ValidTimeEntryRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TimeEntryResponse> {
    const entry = await this.entries.create(TimeEntryMapper.toDetails(body));
    return created(
      res,
      'time-entries',
      TimeEntryMapper.toResponse(entry, this.clock.now()),
    );
  }

  @Put(':id')
  @ApiBody({ type: TimeEntryRequest })
  async update(
    @IdParam() id: string,
    @ValidatedBody(timeEntryRequestSchema) body: ValidTimeEntryRequest,
  ): Promise<TimeEntryResponse> {
    return TimeEntryMapper.toResponse(
      await this.entries.update(id, TimeEntryMapper.toDetails(body)),
      this.clock.now(),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.entries.delete(id);
  }
}
