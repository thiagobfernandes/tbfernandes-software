import { DynamicModule, Module } from '@nestjs/common';
import { DesktopController } from './desktop.controller';

@Module({})
export class DesktopModule {
  static forProfile(profile: string | undefined): DynamicModule {
    return {
      module: DesktopModule,
      controllers: profile === 'desktop' ? [DesktopController] : [],
    };
  }
}
