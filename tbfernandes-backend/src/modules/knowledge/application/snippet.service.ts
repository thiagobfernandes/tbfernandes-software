import { Injectable } from '@nestjs/common';
import {
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import { NotFoundError } from '../../../common/domain';
import {
  KnowledgeLinks,
  Snippet,
  SnippetDetails,
  SnippetRepository,
} from '../domain';
import { LinkValidator } from './link-validator';
import { blankToNull } from './search-text';

/** Snippet use cases (RF-KNW-02..04). */
@Injectable()
export class SnippetService {
  constructor(
    private readonly snippets: SnippetRepository,
    private readonly links: LinkValidator,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly uow: UnitOfWork,
  ) {}

  async create(
    details: SnippetDetails,
    links: KnowledgeLinks,
  ): Promise<Snippet> {
    const ownerId = this.owner.currentOwnerId();
    const snippet = Snippet.create(
      this.ids.forNewAggregate(),
      ownerId,
      details,
      await this.links.check(ownerId, links),
    );
    return this.uow.run(() => this.snippets.create(snippet));
  }

  update(id: string, details: SnippetDetails, links: KnowledgeLinks) {
    return this.uow.run(async () => {
      const snippet = await this.get(id);
      snippet.edit(details, await this.links.check(snippet.ownerId, links));
      return this.snippets.save(snippet);
    });
  }

  delete(id: string): Promise<void> {
    return this.uow.run(async () => this.snippets.delete(await this.get(id)));
  }

  async get(id: string): Promise<Snippet> {
    const snippet = await this.snippets.findById(
      this.owner.currentOwnerId(),
      id,
    );
    if (!snippet) throw new NotFoundError('O snippet', id);
    return snippet;
  }

  search(
    text?: string | null,
    language?: string | null,
    tag?: string | null,
  ): Promise<Snippet[]> {
    return this.snippets.search(this.owner.currentOwnerId(), {
      text: blankToNull(text),
      language: blankToNull(language)?.toLowerCase() ?? null,
      tag: blankToNull(tag),
    });
  }
}
