import { Project } from './project';

export abstract class ProjectRepository {
  abstract create(project: Project): Promise<Project>;
  abstract save(project: Project): Promise<Project>;
  abstract findById(ownerId: string, id: string): Promise<Project | null>;
  abstract findAll(
    ownerId: string,
    companyId?: string | null,
  ): Promise<Project[]>;
  abstract exists(ownerId: string, id: string): Promise<boolean>;
  abstract anyForCompany(ownerId: string, companyId: string): Promise<boolean>;
  abstract delete(project: Project): Promise<void>;
}
