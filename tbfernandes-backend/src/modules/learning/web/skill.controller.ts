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
import { SkillService } from '../application/skill.service';
import {
  SkillMapper,
  SkillRequest,
  skillRequestSchema,
  SkillResponse,
} from '../protocols';
import type { ValidSkillRequest } from '../protocols';

@ApiTags('learning')
@Controller('skills')
export class SkillController {
  constructor(private readonly service: SkillService) {}

  @Get()
  async list(): Promise<SkillResponse[]> {
    return (await this.service.list()).map((item) =>
      SkillMapper.toResponse(item),
    );
  }

  @Get(':id')
  async get(@IdParam() id: string): Promise<SkillResponse> {
    return SkillMapper.toResponse(await this.service.get(id));
  }

  @Post()
  @ApiBody({ type: SkillRequest })
  async create(
    @ValidatedBody(skillRequestSchema) body: ValidSkillRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SkillResponse> {
    const item = await this.service.create(SkillMapper.toDetails(body));
    return created(res, 'skills', SkillMapper.toResponse(item));
  }

  @Put(':id')
  @ApiBody({ type: SkillRequest })
  async update(
    @IdParam() id: string,
    @ValidatedBody(skillRequestSchema) body: ValidSkillRequest,
  ): Promise<SkillResponse> {
    return SkillMapper.toResponse(
      await this.service.update(id, SkillMapper.toDetails(body)),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.service.delete(id);
  }
}
