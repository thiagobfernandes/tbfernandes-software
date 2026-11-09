import { Snippet } from '../../../domain';
import { SnippetEntity, SnippetLinkEntity } from '../snippet.entity';
import { LinkPersistenceMapper } from './link.persistence-mapper';

export const SnippetPersistenceMapper = {
  toDomain(entity: SnippetEntity): Snippet {
    return Snippet.restore(
      entity.id,
      entity.ownerId,
      {
        title: entity.title,
        language: entity.language,
        code: entity.code,
        explanation: entity.explanation,
        sourceUrl: entity.sourceUrl,
        tags: entity.tags ?? [],
      },
      LinkPersistenceMapper.toLinks(entity.links),
      entity.createdAt,
      entity.updatedAt,
    );
  },

  /** The snippet row only; links come from toLinkEntities. */
  toEntity(snippet: Snippet, entity: SnippetEntity = new SnippetEntity()) {
    const details = snippet.details;
    entity.id = snippet.id;
    entity.ownerId = snippet.ownerId;
    entity.title = details.title;
    entity.language = details.language;
    entity.code = details.code;
    entity.explanation = details.explanation;
    entity.sourceUrl = details.sourceUrl;
    entity.tags = details.tags;
    delete entity.links;
    return entity;
  },

  toLinkEntities(snippet: Snippet): SnippetLinkEntity[] {
    return LinkPersistenceMapper.toRows(snippet.links).map((row) =>
      Object.assign(new SnippetLinkEntity(), { snippetId: snippet.id, ...row }),
    );
  },
};
