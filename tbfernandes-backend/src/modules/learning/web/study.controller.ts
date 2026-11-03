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
import { StudyService } from '../application/study.service';
import {
  StudyMapper,
  StudyRequest,
  studyRequestSchema,
  StudyResponse,
} from '../protocols';
import type { ValidStudyRequest } from '../protocols';

@ApiTags('learning')
@Controller('studies')
export class StudyController {
  constructor(private readonly service: StudyService) {}

  @Get()
  async list(): Promise<StudyResponse[]> {
    return (await this.service.list()).map((item) =>
      StudyMapper.toResponse(item),
    );
  }

  @Get(':id')
  async get(@IdParam() id: string): Promise<StudyResponse> {
    return StudyMapper.toResponse(await this.service.get(id));
  }

  @Post()
  @ApiBody({ type: StudyRequest })
  async create(
    @ValidatedBody(studyRequestSchema) body: ValidStudyRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StudyResponse> {
    const item = await this.service.create(StudyMapper.toDetails(body));
    return created(res, 'studies', StudyMapper.toResponse(item));
  }

  @Put(':id')
  @ApiBody({ type: StudyRequest })
  async update(
    @IdParam() id: string,
    @ValidatedBody(studyRequestSchema) body: ValidStudyRequest,
  ): Promise<StudyResponse> {
    return StudyMapper.toResponse(
      await this.service.update(id, StudyMapper.toDetails(body)),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.service.delete(id);
  }
}
