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
import { IdParam, ValidatedBody } from '../../../common/decorators';
import { created } from '../../../common/web/created';
import { RoutineService } from '../application/routine.service';
import {
  RoutineMapper,
  RoutineRequest,
  routineRequestSchema,
  RoutineResponse,
} from '../protocols';
import type { ValidRoutineRequest } from '../protocols';

@ApiTags('work')
@Controller('routines')
export class RoutineController {
  constructor(private readonly routines: RoutineService) {}

  @Get()
  async list(): Promise<RoutineResponse[]> {
    return (await this.routines.list()).map((routine) =>
      RoutineMapper.toResponse(routine),
    );
  }

  @Get(':id')
  async get(@IdParam() id: string): Promise<RoutineResponse> {
    return RoutineMapper.toResponse(await this.routines.get(id));
  }

  @Post()
  @ApiBody({ type: RoutineRequest })
  async create(
    @ValidatedBody(routineRequestSchema) body: ValidRoutineRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RoutineResponse> {
    const routine = await this.routines.create(RoutineMapper.toDetails(body));
    return created(res, 'routines', RoutineMapper.toResponse(routine));
  }

  @Put(':id')
  @ApiBody({ type: RoutineRequest })
  async update(
    @IdParam() id: string,
    @ValidatedBody(routineRequestSchema) body: ValidRoutineRequest,
  ): Promise<RoutineResponse> {
    return RoutineMapper.toResponse(
      await this.routines.update(id, RoutineMapper.toDetails(body)),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.routines.delete(id);
  }
}
