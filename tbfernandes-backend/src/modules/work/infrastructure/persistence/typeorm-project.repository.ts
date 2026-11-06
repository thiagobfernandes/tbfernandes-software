import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { Project, ProjectRepository } from '../../domain';
import { ProjectPersistenceMapper as Mapper } from './mappers/project.persistence-mapper';
import { ProjectEntity } from './project.entity';

@Injectable()
export class TypeOrmProjectRepository extends ProjectRepository {
  private readonly rows: BaseRepository<ProjectEntity>;

  constructor(tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(ProjectEntity, tx);
  }

  async create(project: Project): Promise<Project> {
    await this.rows.insertEntity(Mapper.toEntity(project));
    return project;
  }

  async save(project: Project): Promise<Project> {
    const existing = await this.rows.findOwned(project.ownerId, project.id);
    return Mapper.toDomain(
      await this.rows.saveEntity(
        Mapper.toEntity(project, existing ?? undefined),
      ),
    );
  }

  async findById(ownerId: string, id: string): Promise<Project | null> {
    const entity = await this.rows.findOwned(ownerId, id);
    return entity && Mapper.toDomain(entity);
  }

  async findAll(
    ownerId: string,
    companyId?: string | null,
  ): Promise<Project[]> {
    const rows = await this.rows.findAllOwned(ownerId, {
      where: companyId ? { companyId } : {},
      order: { startDate: 'DESC' },
    });
    return rows.map((item) => Mapper.toDomain(item));
  }

  exists(ownerId: string, id: string): Promise<boolean> {
    return this.rows.existsOwned(ownerId, { id });
  }

  anyForCompany(ownerId: string, companyId: string): Promise<boolean> {
    return this.rows.existsOwned(ownerId, { companyId });
  }

  delete(project: Project): Promise<void> {
    return this.rows.deleteOwned(project.ownerId, project.id);
  }
}
