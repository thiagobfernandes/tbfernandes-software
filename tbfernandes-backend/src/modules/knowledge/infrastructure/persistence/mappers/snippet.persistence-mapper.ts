import { Snippet } from '../../../domain';
import { SnippetEntity, SnippetLinkEntity } from '../snippet.entity';
import { LinkPersistenceMapper } from './link.persistence-mapper';

/** Snippet ↔ knowledge.snippet row and its knowledge.snippet_link rows. */
export const SnippetPersistenceMapper = {
  toDomain(e: SnippetEntity): Snippet {
    return Snippet.restore(
      e.id,
      e.ownerId,
      {
        title: e.title,
        language: e.language,
        code: e.code,
        explanation: e.explanation,
        sourceUrl: e.sourceUrl,
        tags: e.tags ?? [],
      },
      LinkPersistenceMapper.toLinks(e.links),
      e.createdAt,
      e.updatedAt,
    );
  },

  /** The snippet row only; links come from toLinkEntities. */
  toEntity(snippet: Snippet, e: SnippetEntity = new SnippetEntity()) {
    const d = snippet.details;
    e.id = snippet.id;
    e.ownerId = snippet.ownerId;
    e.title = d.title;
    e.language = d.language;
    e.code = d.code;
    e.explanation = d.explanation;
    e.sourceUrl = d.sourceUrl;
    e.tags = d.tags;
    delete e.links;
    return e;
  },

  toLinkEntities(snippet: Snippet): SnippetLinkEntity[] {
    return LinkPersistenceMapper.toRows(snippet.links).map((row) =>
      Object.assign(new SnippetLinkEntity(), { snippetId: snippet.id, ...row }),
    );
  },
};
