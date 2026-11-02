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
import { MaterialService } from '../application/material.service';
import {
  materialListQuerySchema,
  MaterialMapper,
  MaterialRequest,
  materialRequestSchema,
  MaterialResponse,
} from '../protocols';
import type { ValidMaterialRequest } from '../protocols';

@ApiTags('learning')
@Controller('materials')
export class MaterialController {
  constructor(private readonly service: MaterialService) {}

  @Get()
  @ApiQuery({ name: 'studyId', required: false })
  async list(
    @ValidatedQuery(materialListQuerySchema) query: { studyId: string | null },
  ): Promise<MaterialResponse[]> {
    return (await this.service.list(query.studyId)).map((item) =>
      MaterialMapper.toResponse(item),
    );
  }

  @Get(':id')
  async get(@IdParam() id: string): Promise<MaterialResponse> {
    return MaterialMapper.toResponse(await this.service.get(id));
  }

  @Post()
  @ApiBody({ type: MaterialRequest })
  async create(
    @ValidatedBody(materialRequestSchema) body: ValidMaterialRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MaterialResponse> {
    const item = await this.service.create(MaterialMapper.toDetails(body));
    return created(res, 'materials', MaterialMapper.toResponse(item));
  }

  @Put(':id')
  @ApiBody({ type: MaterialRequest })
  async update(
    @IdParam() id: string,
    @ValidatedBody(materialRequestSchema) body: ValidMaterialRequest,
  ): Promise<MaterialResponse> {
    return MaterialMapper.toResponse(
      await this.service.update(id, MaterialMapper.toDetails(body)),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.service.delete(id);
  }
}
