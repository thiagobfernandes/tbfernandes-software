import { Injectable } from '@nestjs/common';
import {
  EventPublisher,
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import { ConflictError, NotFoundError } from '../../../common/domain';
import {
  Company,
  CompanyDetails,
  CompanyRepository,
  ProjectRepository,
} from '../domain';
import { CompanyDeleted, WorkEvents } from '../work.events';

/** Company use cases (RF-WRK-01..03, WRK-11). */
@Injectable()
export class CompanyService {
  constructor(
    private readonly companies: CompanyRepository,
    private readonly projects: ProjectRepository,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly events: EventPublisher,
    private readonly uow: UnitOfWork,
  ) {}

  create(details: CompanyDetails): Promise<Company> {
    return this.companies.create(
      Company.create(
        this.ids.forNewAggregate(),
        this.owner.currentOwnerId(),
        details,
      ),
    );
  }

  update(id: string, details: CompanyDetails): Promise<Company> {
    return this.uow.run(async () => {
      const company = await this.get(id);
      company.update(details);
      return this.companies.save(company);
    });
  }

  /** RN-01: only a company without projects can be deleted; otherwise close it. */
  delete(id: string): Promise<void> {
    return this.uow.run(async () => {
      const company = await this.get(id);
      if (await this.projects.anyForCompany(company.ownerId, id)) {
        throw new ConflictError(
          'RN-01',
          'A empresa tem projetos; encerre-a em vez de excluir',
        );
      }
      await this.companies.delete(company);
      this.events.publish({
        type: WorkEvents.companyDeleted,
        ownerId: company.ownerId,
        companyId: id,
      } satisfies CompanyDeleted);
    });
  }

  async get(id: string): Promise<Company> {
    const company = await this.companies.findById(
      this.owner.currentOwnerId(),
      id,
    );
    if (!company) throw new NotFoundError('A empresa', id);
    return company;
  }

  list(): Promise<Company[]> {
    return this.companies.findAll(this.owner.currentOwnerId());
  }
}
