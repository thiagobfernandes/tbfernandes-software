import { InvalidArgumentError, Require } from '../../../../common/domain';
import { KnowledgeLinks } from '../knowledge-links';
import { Tags } from '../tags';

export interface SnippetDetails {
  title: string;
  /** Lower case, e.g. "java". */
  language: string;
  code: string;
  explanation: string | null;
  sourceUrl: string | null;
  tags: string[];
}

/**
 * A code snippet (RF-KNW-02). The code is kept exactly as entered, never trimmed or
 * executed (RN-11).
 */
export class Snippet {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: SnippetDetails,
    private _links: KnowledgeLinks,
    readonly createdAt: Date | null = null,
    readonly updatedAt: Date | null = null,
  ) {}

  static create(
    id: string,
    ownerId: string,
    details: SnippetDetails,
    links: KnowledgeLinks,
  ): Snippet {
    return new Snippet(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      Snippet.validated(details),
      links,
    );
  }

  static restore(
    id: string,
    ownerId: string,
    details: SnippetDetails,
    links: KnowledgeLinks,
    createdAt: Date,
    updatedAt: Date,
  ): Snippet {
    return new Snippet(id, ownerId, details, links, createdAt, updatedAt);
  }

  get details(): SnippetDetails {
    return { ...this._details, tags: [...this._details.tags] };
  }

  get links(): KnowledgeLinks {
    return this._links;
  }

  edit(details: SnippetDetails, links: KnowledgeLinks): void {
    this._details = Snippet.validated(details);
    this._links = links;
  }

  /** Drops a link to a deleted work item (KNW-06). Returns true if something changed. */
  unlink(workItemId: string): boolean {
    if (!this._links.has(workItemId)) return false;
    this._links = this._links.without(workItemId);
    return true;
  }

  private static validated(details: SnippetDetails): SnippetDetails {
    if (details.code == null || details.code.trim() === '') {
      throw new InvalidArgumentError('code é obrigatório');
    }
    return {
      title: Require.text(details.title, 'title', 200),
      language: Require.text(details.language, 'language', 30).toLowerCase(),
      code: details.code,
      explanation: Require.optionalText(
        details.explanation,
        'explanation',
        5000,
      ),
      sourceUrl: Require.optionalText(details.sourceUrl, 'sourceUrl', 2000),
      tags: Tags.normalize(details.tags),
    };
  }
}
