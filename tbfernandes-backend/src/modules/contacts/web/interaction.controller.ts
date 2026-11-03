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
import { InteractionService } from '../application/interaction.service';
import {
  FollowUpRequest,
  followUpRequestSchema,
  interactionListQuerySchema,
  InteractionMapper,
  InteractionRequest,
  interactionRequestSchema,
  InteractionResponse,
} from '../protocols';
import type {
  InteractionListQuery,
  ValidFollowUpRequest,
  ValidInteractionRequest,
} from '../protocols';

@ApiTags('contacts')
@Controller('interactions')
export class InteractionController {
  constructor(private readonly interactions: InteractionService) {}

  @Get()
  @ApiQuery({ name: 'contactId', required: false })
  async list(
    @ValidatedQuery(interactionListQuerySchema) query: InteractionListQuery,
  ): Promise<InteractionResponse[]> {
    return (await this.interactions.list(query.contactId)).map((item) =>
      InteractionMapper.toResponse(item),
    );
  }

  @Get(':id')
  async get(@IdParam() id: string): Promise<InteractionResponse> {
    return InteractionMapper.toResponse(await this.interactions.get(id));
  }

  @Post()
  @ApiBody({ type: InteractionRequest })
  async create(
    @ValidatedBody(interactionRequestSchema) body: ValidInteractionRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<InteractionResponse> {
    const interaction = await this.interactions.create(
      InteractionMapper.toDetails(body),
    );
    return created(
      res,
      'interactions',
      InteractionMapper.toResponse(interaction),
    );
  }

  @Put(':id')
  @ApiBody({ type: InteractionRequest })
  async update(
    @IdParam() id: string,
    @ValidatedBody(interactionRequestSchema) body: ValidInteractionRequest,
  ): Promise<InteractionResponse> {
    return InteractionMapper.toResponse(
      await this.interactions.update(id, InteractionMapper.toDetails(body)),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.interactions.delete(id);
  }

  /** CTC-03: creates a follow-up task in work, once per interaction (RN-24). */
  @Post(':id/follow-up')
  @HttpCode(200)
  @ApiBody({ type: FollowUpRequest })
  async followUp(
    @IdParam() id: string,
    @ValidatedBody(followUpRequestSchema) body: ValidFollowUpRequest,
  ): Promise<InteractionResponse> {
    return InteractionMapper.toResponse(
      await this.interactions.createFollowUp(id, body.title, body.dueDate),
    );
  }
}
