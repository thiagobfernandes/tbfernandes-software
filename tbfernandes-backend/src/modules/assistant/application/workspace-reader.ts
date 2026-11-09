import { Injectable } from '@nestjs/common';
import { IsoDate, YearMonth } from '../../../common/domain';
import { ContactsLookup } from '../../contacts';
import { FinanceLookup } from '../../finance';
import { GoalsLookup } from '../../goals';
import { KnowledgeLookup } from '../../knowledge';
import { LearningLookup } from '../../learning';
import { WorkLookup } from '../../work';
import { Workspace } from '../domain';

@Injectable()
export class WorkspaceReader {
  constructor(
    private readonly work: WorkLookup,
    private readonly knowledge: KnowledgeLookup,
    private readonly goals: GoalsLookup,
    private readonly learning: LearningLookup,
    private readonly finance: FinanceLookup,
    private readonly contacts: ContactsLookup,
  ) {}

  async read(
    ownerId: string,
    today: IsoDate,
    month: YearMonth,
  ): Promise<Workspace> {
    const [
      companies,
      projects,
      tasks,
      notes,
      snippets,
      goals,
      studies,
      purchases,
      cashFlow,
      contacts,
    ] = await Promise.all([
      this.work.companies(ownerId),
      this.work.projects(ownerId),
      this.work.tasks(ownerId),
      this.knowledge.notes(ownerId),
      this.knowledge.snippets(ownerId),
      this.goals.goals(ownerId),
      this.learning.studies(ownerId),
      this.finance.purchases(ownerId),
      this.finance.month(ownerId, month),
      this.contacts.contacts(ownerId),
    ]);
    return {
      today,
      companies,
      projects,
      tasks,
      notes,
      snippets,
      goals,
      studies,
      purchases,
      month: cashFlow,
      contacts,
    };
  }
}
