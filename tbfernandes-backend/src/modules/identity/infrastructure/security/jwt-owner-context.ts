import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { OwnerContext } from '../../../../common/application';
import { RequestContext } from '../../../../common/context/request-context';
import { UnauthenticatedError } from '../../../../common/domain';
import { authConfig } from '../../../../infrastructure/environments/registers';
import './auth-token';

@Injectable()
export class JwtOwnerContext extends OwnerContext {
  constructor(
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
  ) {
    super();
  }

  currentOwnerId(): string {
    const signedIn = RequestContext.request()?.user?.ownerId;
    if (signedIn) return signedIn;
    if (this.config.mode === 'single-user') return this.config.ownerId;
    throw new UnauthenticatedError();
  }
}
