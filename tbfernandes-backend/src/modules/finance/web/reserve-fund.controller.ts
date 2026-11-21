import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response as HttpResponse } from 'express';
import { IdParam, ValidatedBody } from '../../../common/decorators';
import { created } from '../../../common/web/created';
import { ReserveFundService } from '../application/reserve-fund.service';
import { ReserveFund } from '../domain';
import {
  fundSchema,
  movementSchema,
  PlanningRequestMapper as Request,
  PlanningResponseMapper as Response,
  type ValidFundRequest,
  type ValidMovementRequest,
} from '../protocols';

const toResponse = (fund: ReserveFund) => Response.fund(fund);

/** Emergency reserve, trip money and goals, with their movements (RF-PLN-04). */
@ApiTags('finance-planning')
@Controller('finance/reserves')
export class ReserveFundController {
  constructor(private readonly funds: ReserveFundService) {}

  @Get()
  async list() {
    return (await this.funds.list()).map(toResponse);
  }

  @Get(':id')
  async get(@IdParam() id: string) {
    return toResponse(await this.funds.get(id));
  }

  @Post()
  async create(
    @ValidatedBody(fundSchema) body: ValidFundRequest,
    @Res({ passthrough: true }) res: HttpResponse,
  ) {
    const fund = await this.funds.create(Request.fundDetails(body));
    return created(res, 'finance/reserves', toResponse(fund));
  }

  @Put(':id')
  async update(
    @IdParam() id: string,
    @ValidatedBody(fundSchema) body: ValidFundRequest,
  ) {
    return toResponse(await this.funds.update(id, Request.fundDetails(body)));
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.funds.delete(id);
  }

  @Post(':id/movements')
  @HttpCode(200)
  async addMovement(
    @IdParam() id: string,
    @ValidatedBody(movementSchema) body: ValidMovementRequest,
  ) {
    return toResponse(await this.funds.addMovement(id, Request.movement(body)));
  }

  @Put(':id/movements/:movementId')
  async updateMovement(
    @IdParam() id: string,
    @IdParam('movementId') movementId: string,
    @ValidatedBody(movementSchema) body: ValidMovementRequest,
  ) {
    return toResponse(
      await this.funds.updateMovement(id, movementId, Request.movement(body)),
    );
  }

  @Delete(':id/movements/:movementId')
  async removeMovement(
    @IdParam() id: string,
    @IdParam('movementId') movementId: string,
  ) {
    return toResponse(await this.funds.removeMovement(id, movementId));
  }
}
