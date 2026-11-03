import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../common/domain';
import { WorkLookup } from '../../work';
import { KnowledgeLinks } from '../domain';

/** RN-05: links point to projects and tasks of the same owner. */
@Injectable()
export class LinkValidator {
  constructor(private readonly work: WorkLookup) {}

  async check(ownerId: string, links: KnowledgeLinks): Promise<KnowledgeLinks> {
    for (const id of links.projectIds) {
      if (!(await this.work.projectExists(ownerId, id)))
        throw new NotFoundError('O projeto', id);
    }
    for (const id of links.taskIds) {
      if (!(await this.work.taskExists(ownerId, id)))
        throw new NotFoundError('A tarefa', id);
    }
    return links;
  }
}
