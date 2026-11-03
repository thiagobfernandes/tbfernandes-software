import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Public } from '../decorators';

/** Health check used by compose, nginx and the desktop app: `{ "status": "UP" }`. */
@ApiExcludeController()
@Public()
@Controller('actuator/health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  async health(): Promise<{ status: 'UP' | 'DOWN' }> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'UP' };
    } catch {
      return { status: 'DOWN' };
    }
  }
}
