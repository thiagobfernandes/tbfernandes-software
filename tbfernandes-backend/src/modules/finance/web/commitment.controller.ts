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
import { IdParam, MonthParam, ValidatedBody } from '../../../common/decorators';
import { created } from '../../../common/web/created';
import { CommitmentService } from '../application/commitment.service';
import { Commitment, Money } from '../domain';
import {
  commitmentChangeSchema,
  createCommitmentSchema,
  monthOverrideSchema,
  paymentSchema,
  PlanningRequestMapper as Request,
  PlanningResponseMapper as Response,
  updateCommitmentSchema,
  type ValidChangeRequest,
  type ValidCommitmentRequest,
  type ValidCreateCommitmentRequest,
  type ValidOverrideRequest,
  type ValidPaymentRequest,
} from '../protocols';

const toResponse = (commitment: Commitment) => Response.commitment(commitment);

/** Salary, freelances, loans, bills and subscriptions (RF-PLN-02). */
@ApiTags('finance-planning')
@Controller('finance/commitments')
export class CommitmentController {
  constructor(private readonly commitments: CommitmentService) {}

  @Get()
  async list() {
    return (await this.commitments.list()).map(toResponse);
  }

  @Get(':id')
  async get(@IdParam() id: string) {
    return toResponse(await this.commitments.get(id));
  }

  @Post()
  async create(
    @ValidatedBody(createCommitmentSchema) body: ValidCreateCommitmentRequest,
    @Res({ passthrough: true }) res: HttpResponse,
  ) {
    const commitment = await this.commitments.create(
      Request.commitmentDetails(body),
      {
        amount: Money.cents(body.amount),
        certainty: body.certainty,
        note: body.note,
      },
    );
    return created(res, 'finance/commitments', toResponse(commitment));
  }

  @Put(':id')
  async update(
    @IdParam() id: string,
    @ValidatedBody(updateCommitmentSchema) body: ValidCommitmentRequest,
  ) {
    return toResponse(
      await this.commitments.update(id, Request.commitmentDetails(body)),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.commitments.delete(id);
  }

  /** New amount, certainty or suspension from a month on (RN-PLN-06). */
  @Post(':id/changes')
  @HttpCode(200)
  async change(
    @IdParam() id: string,
    @ValidatedBody(commitmentChangeSchema) body: ValidChangeRequest,
  ) {
    return toResponse(
      await this.commitments.changeFrom(
        id,
        body.fromMonth,
        Request.change(body),
      ),
    );
  }

  @Put(':id/months/:month')
  async setOverride(
    @IdParam() id: string,
    @MonthParam() month: string,
    @ValidatedBody(monthOverrideSchema) body: ValidOverrideRequest,
  ) {
    return toResponse(
      await this.commitments.setOverride(id, {
        month,
        amount: Money.cents(body.amount),
        certainty: body.certainty,
        note: body.note,
      }),
    );
  }

  @Delete(':id/months/:month')
  async clearOverride(@IdParam() id: string, @MonthParam() month: string) {
    return toResponse(await this.commitments.clearOverride(id, month));
  }

  @Put(':id/payments/:month')
  async pay(
    @IdParam() id: string,
    @MonthParam() month: string,
    @ValidatedBody(paymentSchema) body: ValidPaymentRequest,
  ) {
    return toResponse(
      await this.commitments.recordPayment(id, {
        month,
        amount: Money.cents(body.amount),
        paidOn: body.paidOn,
      }),
    );
  }

  @Delete(':id/payments/:month')
  async unpay(@IdParam() id: string, @MonthParam() month: string) {
    return toResponse(await this.commitments.removePayment(id, month));
  }
}
