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
import { CompanyService } from '../application/company.service';
import {
  CompanyMapper,
  CompanyRequest,
  companyRequestSchema,
  CompanyResponse,
} from '../protocols';
import type { ValidCompanyRequest } from '../protocols';

@ApiTags('work')
@Controller('companies')
export class CompanyController {
  constructor(private readonly companies: CompanyService) {}

  @Get()
  async list(): Promise<CompanyResponse[]> {
    return (await this.companies.list()).map((item) =>
      CompanyMapper.toResponse(item),
    );
  }

  @Get(':id')
  async get(@IdParam() id: string): Promise<CompanyResponse> {
    return CompanyMapper.toResponse(await this.companies.get(id));
  }

  @Post()
  @ApiBody({ type: CompanyRequest })
  async create(
    @ValidatedBody(companyRequestSchema) body: ValidCompanyRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CompanyResponse> {
    const company = await this.companies.create(CompanyMapper.toDetails(body));
    return created(res, 'companies', CompanyMapper.toResponse(company));
  }

  @Put(':id')
  @ApiBody({ type: CompanyRequest })
  async update(
    @IdParam() id: string,
    @ValidatedBody(companyRequestSchema) body: ValidCompanyRequest,
  ): Promise<CompanyResponse> {
    return CompanyMapper.toResponse(
      await this.companies.update(id, CompanyMapper.toDetails(body)),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.companies.delete(id);
  }
}
