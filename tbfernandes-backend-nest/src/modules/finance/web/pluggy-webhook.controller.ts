import {
  Controller,
  Headers,
  HttpCode,
  Inject,
  Post,
  Res,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { Public, ValidatedBody } from '../../../common/decorators';
import { pluggyConfig } from '../../../infrastructure/environments/registers';
import { Logger } from '../../../infrastructure/logger';
import { OpenFinanceService } from '../application/open-finance.service';
import { WebhookEvent, webhookEventSchema } from '../protocols';
import type { ValidWebhookEvent } from '../protocols';

/**
 * FIN-OF-06. Public route (no session or CSRF): Pluggy does not sign its webhooks, so it
 * proves itself with the secret header set when the webhook was registered. Without a
 * configured secret every call is refused.
 */
@ApiTags('finance')
@Public()
@Controller('webhooks/pluggy')
export class PluggyWebhookController {
  private readonly secret: Buffer;

  constructor(
    private readonly openFinance: OpenFinanceService,
    @Inject(pluggyConfig.KEY) config: ConfigType<typeof pluggyConfig>,
  ) {
    this.secret = Buffer.from(config.webhookSecret, 'utf8');
  }

  @Post()
  @HttpCode(204)
  @ApiBody({ type: WebhookEvent })
  async receive(
    @Headers('x-webhook-secret') received: string | undefined,
    @ValidatedBody(webhookEventSchema) event: ValidWebhookEvent,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    if (!this.authentic(received)) {
      res.status(401);
      return;
    }
    const itemId = event.itemId;
    if (!itemId) return;
    switch (event.event) {
      case 'item/updated':
      case 'item/error':
        if (
          !(await this.openFinance.connectionChanged(
            itemId,
            event.clientUserId,
          ))
        )
          Logger.warn(`Ignoring webhook for unknown connection ${itemId}`);
        break;
      case 'item/deleted':
        await this.openFinance.connectionDeleted(itemId);
        break;
      case 'transactions/deleted':
        await this.openFinance.transactionsDeleted(
          itemId,
          event.transactionIds,
        );
        break;
      default:
      // Other events carry nothing this app acts on.
    }
  }

  private authentic(received: string | undefined): boolean {
    if (!this.secret.length || received == null) return false;
    const given = Buffer.from(received, 'utf8');
    return (
      given.length === this.secret.length && timingSafeEqual(given, this.secret)
    );
  }
}
