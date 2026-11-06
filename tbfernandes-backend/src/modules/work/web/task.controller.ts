import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { IdGenerator } from '../../../common/application';
import {
  IdParam,
  ValidatedBody,
  ValidatedQuery,
} from '../../../common/decorators';
import { created } from '../../../common/web/created';
import { TaskService } from '../application/task.service';
import { TaskStatus } from '../domain';
import {
  StatusRequest,
  statusRequestSchema,
  taskListQuerySchema,
  TaskMapper,
  TaskRequest,
  taskRequestSchema,
  TaskResponse,
} from '../protocols';
import type { TaskListQuery, ValidTaskRequest } from '../protocols';

@ApiTags('work')
@Controller('tasks')
export class TaskController {
  constructor(
    private readonly tasks: TaskService,
    private readonly ids: IdGenerator,
  ) {}

  /** WRK-03, WRK-06: combinable filters; overdue=true returns open tasks due before today. */
  @Get()
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'dueFrom', required: false })
  @ApiQuery({ name: 'dueTo', required: false })
  @ApiQuery({ name: 'overdue', required: false, type: Boolean })
  async list(
    @ValidatedQuery(taskListQuerySchema) query: TaskListQuery,
  ): Promise<TaskResponse[]> {
    return (await this.tasks.list(query)).map((item) =>
      TaskMapper.toResponse(item),
    );
  }

  @Get(':id')
  async get(@IdParam() id: string): Promise<TaskResponse> {
    return TaskMapper.toResponse(await this.tasks.get(id));
  }

  @Post()
  @ApiBody({ type: TaskRequest })
  async create(
    @ValidatedBody(taskRequestSchema) body: ValidTaskRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TaskResponse> {
    const task = await this.tasks.create(this.toDetails(body), body.status);
    return created(res, 'tasks', TaskMapper.toResponse(task));
  }

  @Put(':id')
  @ApiBody({ type: TaskRequest })
  async update(
    @IdParam() id: string,
    @ValidatedBody(taskRequestSchema) body: ValidTaskRequest,
  ): Promise<TaskResponse> {
    return TaskMapper.toResponse(
      await this.tasks.update(id, this.toDetails(body), body.status),
    );
  }

  @Patch(':id/status')
  @ApiBody({ type: StatusRequest })
  async changeStatus(
    @IdParam() id: string,
    @ValidatedBody(statusRequestSchema) body: { status: TaskStatus },
  ): Promise<TaskResponse> {
    return TaskMapper.toResponse(
      await this.tasks.changeStatus(id, body.status),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.tasks.delete(id);
  }

  private toDetails(body: ValidTaskRequest) {
    return TaskMapper.toDetails(body, () => this.ids.newId());
  }
}
