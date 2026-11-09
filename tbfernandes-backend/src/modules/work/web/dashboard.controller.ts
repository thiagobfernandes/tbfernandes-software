import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WorkSummaryService } from '../application/work-summary.service';
import { WorkSummaryResponse } from '../protocols';

@ApiTags('work')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly summaries: WorkSummaryService) {}

  @Get('summary')
  summary(): Promise<WorkSummaryResponse> {
    return this.summaries.summary();
  }
}
