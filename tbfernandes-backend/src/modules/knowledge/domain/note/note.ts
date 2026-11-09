import { Require } from '../../../../common/domain';
import { KnowledgeLinks } from '../knowledge-links';
import { Tags } from '../tags';

export interface NoteDetails {
  title: string;
  body: string;
  tags: string[];
}

export class Note {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: NoteDetails,
    private _links: KnowledgeLinks,
    readonly createdAt: Date | null = null,
    readonly updatedAt: Date | null = null,
  ) {}

  static create(
    id: string,
    ownerId: string,
    details: NoteDetails,
    links: KnowledgeLinks,
  ): Note {
    return new Note(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      Note.validated(details),
      links,
    );
  }

  static restore(
    id: string,
    ownerId: string,
    details: NoteDetails,
    links: KnowledgeLinks,
    createdAt: Date,
    updatedAt: Date,
  ): Note {
    return new Note(id, ownerId, details, links, createdAt, updatedAt);
  }

  get details(): NoteDetails {
    return { ...this._details, tags: [...this._details.tags] };
  }

  get links(): KnowledgeLinks {
    return this._links;
  }

  edit(details: NoteDetails, links: KnowledgeLinks): void {
    this._details = Note.validated(details);
    this._links = links;
  }

  /** Drops a link to a deleted work item (KNW-06). Returns true if something changed. */
  unlink(workItemId: string): boolean {
    if (!this._links.has(workItemId)) return false;
    this._links = this._links.without(workItemId);
    return true;
  }

  private static validated(details: NoteDetails): NoteDetails {
    return {
      title: Require.text(details.title, 'title', 200),
      body: details.body ?? '',
      tags: Tags.normalize(details.tags),
    };
  }
}
