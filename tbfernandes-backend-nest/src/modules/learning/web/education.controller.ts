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
import { EducationService } from '../application/education.service';
import {
  EducationMapper,
  EducationRequest,
  educationRequestSchema,
  EducationResponse,
} from '../protocols';
import type { ValidEducationRequest } from '../protocols';

@ApiTags('learning')
@Controller('educations')
export class EducationController {
  constructor(private readonly service: EducationService) {}

  @Get()
  async list(): Promise<EducationResponse[]> {
    return (await this.service.list()).map((item) =>
      EducationMapper.toResponse(item),
    );
  }

  @Get(':id')
  async get(@IdParam() id: string): Promise<EducationResponse> {
    return EducationMapper.toResponse(await this.service.get(id));
  }

  @Post()
  @ApiBody({ type: EducationRequest })
  async create(
    @ValidatedBody(educationRequestSchema) body: ValidEducationRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<EducationResponse> {
    const item = await this.service.create(EducationMapper.toDetails(body));
    return created(res, 'educations', EducationMapper.toResponse(item));
  }

  @Put(':id')
  @ApiBody({ type: EducationRequest })
  async update(
    @IdParam() id: string,
    @ValidatedBody(educationRequestSchema) body: ValidEducationRequest,
  ): Promise<EducationResponse> {
    return EducationMapper.toResponse(
      await this.service.update(id, EducationMapper.toDetails(body)),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.service.delete(id);
  }
}
