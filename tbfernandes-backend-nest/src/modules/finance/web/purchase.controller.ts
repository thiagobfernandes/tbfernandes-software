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
import { PurchaseService } from '../application/purchase.service';
import {
  ProjectionResponse,
  PurchaseMapper,
  PurchaseRequest,
  purchaseRequestSchema,
  PurchaseResponse,
} from '../protocols';
import type { ValidPurchaseRequest } from '../protocols';

@ApiTags('finance')
@Controller('finance/purchases')
export class PurchaseController {
  constructor(private readonly purchases: PurchaseService) {}

  @Get()
  async list(): Promise<PurchaseResponse[]> {
    return (await this.purchases.list()).map((purchase) =>
      PurchaseMapper.toResponse(purchase),
    );
  }

  @Get(':id')
  async get(@IdParam() id: string): Promise<PurchaseResponse> {
    return PurchaseMapper.toResponse(await this.purchases.get(id));
  }

  /** FIN-04: when the purchase becomes affordable at the planned monthly saving. */
  @Get(':id/projection')
  async projection(@IdParam() id: string): Promise<ProjectionResponse> {
    return PurchaseMapper.toProjection(await this.purchases.projection(id));
  }

  @Post()
  @ApiBody({ type: PurchaseRequest })
  async create(
    @ValidatedBody(purchaseRequestSchema) body: ValidPurchaseRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PurchaseResponse> {
    const purchase = await this.purchases.create(
      PurchaseMapper.toDetails(body),
    );
    return created(
      res,
      'finance/purchases',
      PurchaseMapper.toResponse(purchase),
    );
  }

  @Put(':id')
  @ApiBody({ type: PurchaseRequest })
  async update(
    @IdParam() id: string,
    @ValidatedBody(purchaseRequestSchema) body: ValidPurchaseRequest,
  ): Promise<PurchaseResponse> {
    return PurchaseMapper.toResponse(
      await this.purchases.update(id, PurchaseMapper.toDetails(body)),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.purchases.delete(id);
  }
}
