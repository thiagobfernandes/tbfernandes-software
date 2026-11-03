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
import { SnippetService } from '../application/snippet.service';
import {
  snippetListQuerySchema,
  SnippetMapper,
  SnippetRequest,
  snippetRequestSchema,
  SnippetResponse,
} from '../protocols';
import type { SnippetListQuery, ValidSnippetRequest } from '../protocols';

@ApiTags('knowledge')
@Controller('snippets')
export class SnippetController {
  constructor(private readonly snippets: SnippetService) {}

  /** q searches title, explanation and code; language and tag filter exactly. */
  @Get()
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'language', required: false })
  @ApiQuery({ name: 'tag', required: false })
  async list(
    @ValidatedQuery(snippetListQuerySchema) query: SnippetListQuery,
  ): Promise<SnippetResponse[]> {
    const found = await this.snippets.search(
      query.q,
      query.language,
      query.tag,
    );
    return found.map((snippet) => SnippetMapper.toResponse(snippet));
  }

  @Get(':id')
  async get(@IdParam() id: string): Promise<SnippetResponse> {
    return SnippetMapper.toResponse(await this.snippets.get(id));
  }

  @Post()
  @ApiBody({ type: SnippetRequest })
  async create(
    @ValidatedBody(snippetRequestSchema) body: ValidSnippetRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SnippetResponse> {
    const snippet = await this.snippets.create(
      SnippetMapper.toDetails(body),
      SnippetMapper.toLinks(body),
    );
    return created(res, 'snippets', SnippetMapper.toResponse(snippet));
  }

  @Put(':id')
  @ApiBody({ type: SnippetRequest })
  async update(
    @IdParam() id: string,
    @ValidatedBody(snippetRequestSchema) body: ValidSnippetRequest,
  ): Promise<SnippetResponse> {
    return SnippetMapper.toResponse(
      await this.snippets.update(
        id,
        SnippetMapper.toDetails(body),
        SnippetMapper.toLinks(body),
      ),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.snippets.delete(id);
  }
}
