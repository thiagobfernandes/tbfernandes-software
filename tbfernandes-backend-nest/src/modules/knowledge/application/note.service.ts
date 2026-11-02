import { Injectable } from '@nestjs/common';
import {
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import { NotFoundError } from '../../../common/domain';
import { KnowledgeLinks, Note, NoteDetails, NoteRepository } from '../domain';
import { LinkValidator } from './link-validator';
import { blankToNull } from './search-text';

/** Note use cases (RF-KNW-01, RF-KNW-03, RF-KNW-04). */
@Injectable()
export class NoteService {
  constructor(
    private readonly notes: NoteRepository,
    private readonly links: LinkValidator,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly uow: UnitOfWork,
  ) {}

  async create(details: NoteDetails, links: KnowledgeLinks): Promise<Note> {
    const ownerId = this.owner.currentOwnerId();
    const note = Note.create(
      this.ids.forNewAggregate(),
      ownerId,
      details,
      await this.links.check(ownerId, links),
    );
    return this.uow.run(() => this.notes.create(note));
  }

  update(id: string, details: NoteDetails, links: KnowledgeLinks) {
    return this.uow.run(async () => {
      const note = await this.get(id);
      note.edit(details, await this.links.check(note.ownerId, links));
      return this.notes.save(note);
    });
  }

  delete(id: string): Promise<void> {
    return this.uow.run(async () => this.notes.delete(await this.get(id)));
  }

  async get(id: string): Promise<Note> {
    const note = await this.notes.findById(this.owner.currentOwnerId(), id);
    if (!note) throw new NotFoundError('A nota', id);
    return note;
  }

  search(text?: string | null, tag?: string | null): Promise<Note[]> {
    return this.notes.search(
      this.owner.currentOwnerId(),
      blankToNull(text),
      blankToNull(tag),
    );
  }
}
