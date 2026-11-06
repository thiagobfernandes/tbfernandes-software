import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { IdParam, ValidatedBody } from '../../../common/decorators';
import { created } from '../../../common/web/created';
import { GoalLinksService } from '../application/goal-links.service';
import { GoalService } from '../application/goal.service';
import { Decimals } from '../domain';
import {
  GoalLinksResponse,
  GoalMapper,
  GoalRequest,
  goalRequestSchema,
  GoalResponse,
  ProgressRequest,
  progressRequestSchema,
} from '../protocols';
import type { ValidGoalRequest } from '../protocols';

@ApiTags('goals')
@Controller('goals')
export class GoalController {
  constructor(
    private readonly goals: GoalService,
    private readonly links: GoalLinksService,
  ) {}

  @Get()
  async list(): Promise<GoalResponse[]> {
    return (await this.goals.list()).map((goal) => GoalMapper.toResponse(goal));
  }

  @Get(':id')
  async get(@IdParam() id: string): Promise<GoalResponse> {
    return GoalMapper.toResponse(await this.goals.get(id));
  }

  @Get(':id/links')
  linksOf(@IdParam() id: string): Promise<GoalLinksResponse> {
    return this.links.linksOf(id);
  }

  @Post()
  @ApiBody({ type: GoalRequest })
  async create(
    @ValidatedBody(goalRequestSchema) body: ValidGoalRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<GoalResponse> {
    const goal = await this.goals.create(GoalMapper.toDetails(body));
    return created(res, 'goals', GoalMapper.toResponse(goal));
  }

  @Put(':id')
  @ApiBody({ type: GoalRequest })
  async update(
    @IdParam() id: string,
    @ValidatedBody(goalRequestSchema) body: ValidGoalRequest,
  ): Promise<GoalResponse> {
    return GoalMapper.toResponse(
      await this.goals.update(id, GoalMapper.toDetails(body)),
    );
  }

  /** RF-GOL-04: only the current value of the indicator. */
  @Patch(':id/indicator')
  @ApiBody({ type: ProgressRequest })
  async recordProgress(
    @IdParam() id: string,
    @ValidatedBody(progressRequestSchema) body: { current: number },
  ): Promise<GoalResponse> {
    return GoalMapper.toResponse(
      await this.goals.recordProgress(id, Decimals.hundredths(body.current)),
    );
  }

  /** RN-09: sub-goals and milestones go with it. */
  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.goals.delete(id);
  }
}
