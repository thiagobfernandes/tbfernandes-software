import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  IdParam,
  ValidatedBody,
  ValidatedQuery,
} from '../../../common/decorators';
import { created } from '../../../common/web/created';
import { RoutineCheckService } from '../application/routine-check.service';
import {
  RoutineCheckMapper,
  RoutineCheckRequest,
  routineCheckListQuerySchema,
  routineCheckRequestSchema,
  RoutineCheckResponse,
} from '../protocols';
import type {
  RoutineCheckListQuery,
  ValidRoutineCheckRequest,
} from '../protocols';

/** A check is a routine done on one day: POST marks it, DELETE unmarks it. */
@ApiTags('work')
@Controller('routine-checks')
export class RoutineCheckController {
  constructor(private readonly checks: RoutineCheckService) {}

  @Get()
  @ApiQuery({ name: 'routineId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async list(
    @ValidatedQuery(routineCheckListQuerySchema) query: RoutineCheckListQuery,
  ): Promise<RoutineCheckResponse[]> {
    return (await this.checks.list(query)).map((check) =>
      RoutineCheckMapper.toResponse(check),
    );
  }

  @Get(':id')
  async get(@IdParam() id: string): Promise<RoutineCheckResponse> {
    return RoutineCheckMapper.toResponse(await this.checks.get(id));
  }

  @Post()
  @ApiBody({ type: RoutineCheckRequest })
  async create(
    @ValidatedBody(routineCheckRequestSchema) body: ValidRoutineCheckRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RoutineCheckResponse> {
    const check = await this.checks.create(RoutineCheckMapper.toDetails(body));
    return created(res, 'routine-checks', RoutineCheckMapper.toResponse(check));
  }

  /** Only the note changes. */
  @Put(':id')
  @ApiBody({ type: RoutineCheckRequest })
  async update(
    @IdParam() id: string,
    @ValidatedBody(routineCheckRequestSchema) body: ValidRoutineCheckRequest,
  ): Promise<RoutineCheckResponse> {
    return RoutineCheckMapper.toResponse(
      await this.checks.update(id, body.note),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.checks.delete(id);
  }
}
