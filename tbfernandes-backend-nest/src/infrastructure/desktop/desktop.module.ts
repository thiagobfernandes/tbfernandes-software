import { DynamicModule, Module } from '@nestjs/common';
import { DesktopController } from './desktop.controller';

/** The shutdown endpoint, only in the desktop profile. */
@Module({})
export class DesktopModule {
  static forProfile(profile: string | undefined): DynamicModule {
    return {
      module: DesktopModule,
      controllers: profile === 'desktop' ? [DesktopController] : [],
    };
  }
}
