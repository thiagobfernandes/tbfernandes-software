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
import { NoteService } from '../application/note.service';
import {
  noteListQuerySchema,
  NoteMapper,
  NoteRequest,
  noteRequestSchema,
  NoteResponse,
} from '../protocols';
import type { NoteListQuery, ValidNoteRequest } from '../protocols';

@ApiTags('knowledge')
@Controller('notes')
export class NoteController {
  constructor(private readonly notes: NoteService) {}

  /** q searches title and body; tag filters exactly (KNW-04). */
  @Get()
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'tag', required: false })
  async list(
    @ValidatedQuery(noteListQuerySchema) query: NoteListQuery,
  ): Promise<NoteResponse[]> {
    return (await this.notes.search(query.q, query.tag)).map((note) =>
      NoteMapper.toResponse(note),
    );
  }

  @Get(':id')
  async get(@IdParam() id: string): Promise<NoteResponse> {
    return NoteMapper.toResponse(await this.notes.get(id));
  }

  @Post()
  @ApiBody({ type: NoteRequest })
  async create(
    @ValidatedBody(noteRequestSchema) body: ValidNoteRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<NoteResponse> {
    const note = await this.notes.create(
      NoteMapper.toDetails(body),
      NoteMapper.toLinks(body),
    );
    return created(res, 'notes', NoteMapper.toResponse(note));
  }

  @Put(':id')
  @ApiBody({ type: NoteRequest })
  async update(
    @IdParam() id: string,
    @ValidatedBody(noteRequestSchema) body: ValidNoteRequest,
  ): Promise<NoteResponse> {
    return NoteMapper.toResponse(
      await this.notes.update(
        id,
        NoteMapper.toDetails(body),
        NoteMapper.toLinks(body),
      ),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.notes.delete(id);
  }
}
