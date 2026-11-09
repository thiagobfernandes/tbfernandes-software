import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { ValidatedBody } from '../../../common/decorators';
import { AssistantService } from '../application/assistant.service';
import {
  AnswerMapper,
  AnswerResponse,
  GraphMapper,
  GraphResponse,
  QuestionRequest,
  questionRequestSchema,
} from '../protocols';

@ApiTags('assistant')
@Controller()
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  /** AST-01: POST, not GET, because questions can be long and should not end up in access logs. */
  @Post('assistant/questions')
  @HttpCode(200)
  @ApiBody({ type: QuestionRequest })
  async ask(
    @ValidatedBody(questionRequestSchema) request: QuestionRequest,
  ): Promise<AnswerResponse> {
    return AnswerMapper.toResponse(await this.assistant.ask(request.question));
  }

  @Get('graph')
  async graph(): Promise<GraphResponse> {
    return GraphMapper.toResponse(await this.assistant.graph());
  }
}
