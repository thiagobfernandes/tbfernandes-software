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
import { CreditCardService } from '../application/credit-card.service';
import { CreditCard, Money } from '../domain';
import {
  cardSchema,
  classificationSchema,
  paymentSchema,
  PlanningRequestMapper as Request,
  PlanningResponseMapper as Response,
  purchaseSchema,
  statementImportSchema,
  statementSchema,
  type ValidCardPurchaseRequest,
  type ValidCardRequest,
  type ValidClassificationRequest,
  type ValidImportRequest,
  type ValidPaymentRequest,
  type ValidStatementRequest,
} from '../protocols';

const toResponse = (card: CreditCard) => Response.card(card);

/** Cards, statements (CSV or typed) and installment purchases (RF-PLN-03). */
@ApiTags('finance-planning')
@Controller('finance/cards')
export class CreditCardController {
  constructor(private readonly cards: CreditCardService) {}

  @Get()
  async list() {
    return (await this.cards.list()).map(toResponse);
  }

  @Get(':id')
  async get(@IdParam() id: string) {
    return toResponse(await this.cards.get(id));
  }

  @Post()
  async create(
    @ValidatedBody(cardSchema) body: ValidCardRequest,
    @Res({ passthrough: true }) res: HttpResponse,
  ) {
    const card = await this.cards.create(Request.cardDetails(body));
    return created(res, 'finance/cards', toResponse(card));
  }

  @Put(':id')
  async update(
    @IdParam() id: string,
    @ValidatedBody(cardSchema) body: ValidCardRequest,
  ) {
    return toResponse(await this.cards.update(id, Request.cardDetails(body)));
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.cards.delete(id);
  }

  /** Imports a statement CSV; lines already imported are skipped (RN-PLN-07). */
  @Post(':id/imports')
  @HttpCode(200)
  async import(
    @IdParam() id: string,
    @ValidatedBody(statementImportSchema) body: ValidImportRequest,
  ) {
    const { result, card } = await this.cards.importStatement(
      id,
      body.dueDate,
      body.csv,
    );
    return {
      ...result,
      total: Money.toNumber(result.total),
      card: toResponse(card),
    };
  }

  /** Statement typed by hand, for a card without a CSV export. */
  @Put(':id/statements/:month')
  async setStatement(
    @IdParam() id: string,
    @MonthParam() month: string,
    @ValidatedBody(statementSchema) body: ValidStatementRequest,
  ) {
    return toResponse(
      await this.cards.setStatement(
        id,
        month,
        Money.cents(body.total),
        body.certainty,
      ),
    );
  }

  @Delete(':id/statements/:month')
  async removeStatement(@IdParam() id: string, @MonthParam() month: string) {
    return toResponse(await this.cards.removeStatement(id, month));
  }

  @Put(':id/statements/:month/payment')
  async payStatement(
    @IdParam() id: string,
    @MonthParam() month: string,
    @ValidatedBody(paymentSchema) body: ValidPaymentRequest,
  ) {
    return toResponse(
      await this.cards.payStatement(id, month, {
        amount: Money.cents(body.amount),
        paidOn: body.paidOn,
      }),
    );
  }

  @Delete(':id/statements/:month/payment')
  async unpayStatement(@IdParam() id: string, @MonthParam() month: string) {
    return toResponse(await this.cards.payStatement(id, month, null));
  }

  @Post(':id/purchases')
  @HttpCode(200)
  async addPurchase(
    @IdParam() id: string,
    @ValidatedBody(purchaseSchema) body: ValidCardPurchaseRequest,
  ) {
    return toResponse(await this.cards.addPurchase(id, Request.purchase(body)));
  }

  @Put(':id/purchases/:purchaseId')
  async updatePurchase(
    @IdParam() id: string,
    @IdParam('purchaseId') purchaseId: string,
    @ValidatedBody(purchaseSchema) body: ValidCardPurchaseRequest,
  ) {
    return toResponse(
      await this.cards.updatePurchase(id, purchaseId, Request.purchase(body)),
    );
  }

  @Delete(':id/purchases/:purchaseId')
  async removePurchase(
    @IdParam() id: string,
    @IdParam('purchaseId') purchaseId: string,
  ) {
    return toResponse(await this.cards.removePurchase(id, purchaseId));
  }

  /** Marks a charge as part of a subscription; it stays inside the statement total. */
  @Put(':id/transactions/:transactionId/classification')
  async classify(
    @IdParam() id: string,
    @IdParam('transactionId') transactionId: string,
    @ValidatedBody(classificationSchema) body: ValidClassificationRequest,
  ) {
    return toResponse(
      await this.cards.classify(id, transactionId, body.commitmentId),
    );
  }
}
