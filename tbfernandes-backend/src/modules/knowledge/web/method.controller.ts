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
import { MethodService } from '../application/method.service';
import {
  MethodMapper,
  MethodRequest,
  methodRequestSchema,
  MethodResponse,
} from '../protocols';
import type { ValidMethodRequest } from '../protocols';

@ApiTags('knowledge')
@Controller('methods')
export class MethodController {
  constructor(private readonly methods: MethodService) {}

  @Get()
  async list(): Promise<MethodResponse[]> {
    return (await this.methods.list()).map((method) =>
      MethodMapper.toResponse(method),
    );
  }

  @Get(':id')
  async get(@IdParam() id: string): Promise<MethodResponse> {
    return MethodMapper.toResponse(await this.methods.get(id));
  }

  @Post()
  @ApiBody({ type: MethodRequest })
  async create(
    @ValidatedBody(methodRequestSchema) body: ValidMethodRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MethodResponse> {
    const method = await this.methods.create(MethodMapper.toDetails(body));
    return created(res, 'methods', MethodMapper.toResponse(method));
  }

  @Put(':id')
  @ApiBody({ type: MethodRequest })
  async update(
    @IdParam() id: string,
    @ValidatedBody(methodRequestSchema) body: ValidMethodRequest,
  ): Promise<MethodResponse> {
    return MethodMapper.toResponse(
      await this.methods.update(id, MethodMapper.toDetails(body)),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.methods.delete(id);
  }
}
