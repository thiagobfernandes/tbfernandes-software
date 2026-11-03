import { Controller, HttpCode, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { desktopRuntime } from './desktop-runtime';

/**
 * Called by the Windows app when its window closes, so PostgreSQL stops cleanly. Public for
 * the login check only: the launch token middleware still guards it.
 */
@ApiExcludeController()
@Public()
@Controller('desktop')
export class DesktopController {
  @Post('shutdown')
  @HttpCode(202)
  shutdown(): void {
    // After the answer is sent, so the app gets its 202.
    setImmediate(() => void desktopRuntime()?.exit());
  }
}
