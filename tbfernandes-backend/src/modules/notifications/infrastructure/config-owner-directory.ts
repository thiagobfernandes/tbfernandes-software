import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { authConfig } from '../../../infrastructure/environments/registers';
import { OwnerDirectory } from '../application/owner-directory';

/** One person per instance: the account in TBF_AUTH_OWNER_ID. */
@Injectable()
export class ConfigOwnerDirectory extends OwnerDirectory {
  constructor(
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
  ) {
    super();
  }

  owners(): string[] {
    return [this.config.ownerId];
  }
}
