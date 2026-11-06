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
import { ProjectService } from '../application/project.service';
import {
  projectListQuerySchema,
  ProjectMapper,
  ProjectRequest,
  projectRequestSchema,
  ProjectResponse,
} from '../protocols';
import type { ProjectListQuery, ValidProjectRequest } from '../protocols';

@ApiTags('work')
@Controller('projects')
export class ProjectController {
  constructor(private readonly projects: ProjectService) {}

  @Get()
  @ApiQuery({ name: 'companyId', required: false })
  async list(
    @ValidatedQuery(projectListQuerySchema) query: ProjectListQuery,
  ): Promise<ProjectResponse[]> {
    const projects = await this.projects.list(query.companyId);
    return projects.map((project) => ProjectMapper.toResponse(project));
  }

  @Get(':id')
  async get(@IdParam() id: string): Promise<ProjectResponse> {
    return ProjectMapper.toResponse(await this.projects.get(id));
  }

  @Post()
  @ApiBody({ type: ProjectRequest })
  async create(
    @ValidatedBody(projectRequestSchema) body: ValidProjectRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ProjectResponse> {
    const project = await this.projects.create(ProjectMapper.toDetails(body));
    return created(res, 'projects', ProjectMapper.toResponse(project));
  }

  @Put(':id')
  @ApiBody({ type: ProjectRequest })
  async update(
    @IdParam() id: string,
    @ValidatedBody(projectRequestSchema) body: ValidProjectRequest,
  ): Promise<ProjectResponse> {
    return ProjectMapper.toResponse(
      await this.projects.update(id, ProjectMapper.toDetails(body)),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.projects.delete(id);
  }
}
