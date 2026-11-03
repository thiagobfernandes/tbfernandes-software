import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  IdParam,
  ValidatedBody,
  ValidatedQuery,
} from '../../../common/decorators';
import { created } from '../../../common/web/created';
import { FinanceEntryService } from '../application/finance-entry.service';
import {
  EntryMapper,
  EntryRequest,
  entryListQuerySchema,
  entryRequestSchema,
  EntryResponse,
} from '../protocols';
import type { EntryListQuery, ValidEntryRequest } from '../protocols';

@ApiTags('finance')
@Controller('finance/entries')
export class FinanceEntryController {
  constructor(private readonly entries: FinanceEntryService) {}

  /** month=YYYY-MM keeps one month; scope=personal|business keeps one scope. */
  @Get()
  @ApiQuery({ name: 'month', required: false, type: String })
  @ApiQuery({ name: 'scope', required: false, type: String })
  async list(
    @ValidatedQuery(entryListQuerySchema) query: EntryListQuery,
  ): Promise<EntryResponse[]> {
    return (await this.entries.list(query.month, query.scope)).map((entry) =>
      EntryMapper.toResponse(entry),
    );
  }

  @Get(':id')
  async get(@IdParam() id: string): Promise<EntryResponse> {
    return EntryMapper.toResponse(await this.entries.get(id));
  }

  @Post()
  @ApiBody({ type: EntryRequest })
  async create(
    @ValidatedBody(entryRequestSchema) body: ValidEntryRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<EntryResponse> {
    const entry = await this.entries.create(EntryMapper.toDetails(body));
    return created(res, 'finance/entries', EntryMapper.toResponse(entry));
  }

  @Put(':id')
  @ApiBody({ type: EntryRequest })
  async update(
    @IdParam() id: string,
    @ValidatedBody(entryRequestSchema) body: ValidEntryRequest,
  ): Promise<EntryResponse> {
    return EntryMapper.toResponse(
      await this.entries.update(id, EntryMapper.toDetails(body)),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.entries.delete(id);
  }
}
