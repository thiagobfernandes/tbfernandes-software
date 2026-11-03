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
import { CertificationService } from '../application/certification.service';
import {
  certificationListQuerySchema,
  CertificationMapper,
  CertificationRequest,
  certificationRequestSchema,
  CertificationResponse,
} from '../protocols';
import type { ValidCertificationRequest } from '../protocols';

@ApiTags('learning')
@Controller('certifications')
export class CertificationController {
  constructor(private readonly service: CertificationService) {}

  @Get()
  @ApiQuery({ name: 'expiringWithinDays', required: false, type: Number })
  async list(
    @ValidatedQuery(certificationListQuerySchema)
    query: {
      expiringWithinDays: number | null;
    },
  ): Promise<CertificationResponse[]> {
    return (await this.service.list(query.expiringWithinDays)).map((item) =>
      CertificationMapper.toResponse(item),
    );
  }

  @Get(':id')
  async get(@IdParam() id: string): Promise<CertificationResponse> {
    return CertificationMapper.toResponse(await this.service.get(id));
  }

  @Post()
  @ApiBody({ type: CertificationRequest })
  async create(
    @ValidatedBody(certificationRequestSchema) body: ValidCertificationRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CertificationResponse> {
    const item = await this.service.create(CertificationMapper.toDetails(body));
    return created(res, 'certifications', CertificationMapper.toResponse(item));
  }

  @Put(':id')
  @ApiBody({ type: CertificationRequest })
  async update(
    @IdParam() id: string,
    @ValidatedBody(certificationRequestSchema) body: ValidCertificationRequest,
  ): Promise<CertificationResponse> {
    return CertificationMapper.toResponse(
      await this.service.update(id, CertificationMapper.toDetails(body)),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.service.delete(id);
  }
}
