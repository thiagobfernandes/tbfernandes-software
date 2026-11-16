import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { UnauthenticatedError } from '../../../common/domain';
import { prospectingConfig } from '../../../infrastructure/environments/registers';

export const INGEST_KEY_HEADER = 'x-ingest-key';

/** The prospecting worker proves itself with PROSPECTING_INGEST_KEY; no key configured, no access. */
@Injectable()
export class IngestKeyGuard implements CanActivate {
  private readonly key: Buffer;

  constructor(
    @Inject(prospectingConfig.KEY)
    config: ConfigType<typeof prospectingConfig>,
  ) {
    this.key = Buffer.from(config.ingestKey, 'utf8');
  }

  canActivate(context: ExecutionContext): boolean {
    const received = context
      .switchToHttp()
      .getRequest<Request>()
      .header(INGEST_KEY_HEADER);
    const given = Buffer.from(received ?? '', 'utf8');
    const valid =
      this.key.length > 0 &&
      given.length === this.key.length &&
      timingSafeEqual(given, this.key);
    if (!valid) throw new UnauthenticatedError('Chave de ingestão inválida');
    return true;
  }
}
