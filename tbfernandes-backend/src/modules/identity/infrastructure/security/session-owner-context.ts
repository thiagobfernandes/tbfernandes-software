import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { OwnerContext } from '../../../../common/application';
import { RequestContext } from '../../../../common/context/request-context';
import { UnauthenticatedError } from '../../../../common/domain';
import { authConfig } from '../../../../infrastructure/environments/registers';
import './session';

/**
 * IDN-02: the owner is the signed-in account. In single-user mode, requests without a login
 * act as TBF_AUTH_OWNER_ID.
 */
@Injectable()
export class SessionOwnerContext extends OwnerContext {
  constructor(
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
  ) {
    super();
  }

  currentOwnerId(): string {
    const signedIn = RequestContext.request()?.session?.ownerId;
    if (signedIn) return signedIn;
    if (this.config.mode === 'single-user') return this.config.ownerId;
    throw new UnauthenticatedError();
  }
}
