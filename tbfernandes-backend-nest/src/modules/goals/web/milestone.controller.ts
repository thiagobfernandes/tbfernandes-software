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
import { MilestoneService } from '../application/milestone.service';
import {
  milestoneListQuerySchema,
  MilestoneMapper,
  MilestoneRequest,
  milestoneRequestSchema,
  MilestoneResponse,
} from '../protocols';
import type { MilestoneListQuery, ValidMilestoneRequest } from '../protocols';

@ApiTags('goals')
@Controller('milestones')
export class MilestoneController {
  constructor(private readonly milestones: MilestoneService) {}

  /** goalId keeps the milestones of one goal. */
  @Get()
  @ApiQuery({ name: 'goalId', required: false, type: String })
  async list(
    @ValidatedQuery(milestoneListQuerySchema) query: MilestoneListQuery,
  ): Promise<MilestoneResponse[]> {
    return (await this.milestones.list(query.goalId)).map((m) =>
      MilestoneMapper.toResponse(m),
    );
  }

  @Get(':id')
  async get(@IdParam() id: string): Promise<MilestoneResponse> {
    return MilestoneMapper.toResponse(await this.milestones.get(id));
  }

  @Post()
  @ApiBody({ type: MilestoneRequest })
  async create(
    @ValidatedBody(milestoneRequestSchema) body: ValidMilestoneRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MilestoneResponse> {
    const milestone = await this.milestones.create(
      MilestoneMapper.toDetails(body),
    );
    return created(res, 'milestones', MilestoneMapper.toResponse(milestone));
  }

  @Put(':id')
  @ApiBody({ type: MilestoneRequest })
  async update(
    @IdParam() id: string,
    @ValidatedBody(milestoneRequestSchema) body: ValidMilestoneRequest,
  ): Promise<MilestoneResponse> {
    return MilestoneMapper.toResponse(
      await this.milestones.update(id, MilestoneMapper.toDetails(body)),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.milestones.delete(id);
  }
}
