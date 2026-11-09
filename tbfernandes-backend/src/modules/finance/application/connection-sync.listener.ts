import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CONNECTION_SYNC_REQUESTED } from './connection-sync-requested';
import type { ConnectionSyncRequested } from './connection-sync-requested';
import { OpenFinanceService } from './open-finance.service';

@Injectable()
export class ConnectionSyncListener {
  constructor(private readonly service: OpenFinanceService) {}

  @OnEvent(CONNECTION_SYNC_REQUESTED, { async: true, promisify: true })
  on(event: ConnectionSyncRequested): Promise<void> {
    return this.service.syncRequested(event);
  }
}
