import { Note } from '../../../domain';
import { NoteEntity, NoteLinkEntity } from '../note.entity';
import { LinkPersistenceMapper } from './link.persistence-mapper';

export const NotePersistenceMapper = {
  toDomain(entity: NoteEntity): Note {
    return Note.restore(
      entity.id,
      entity.ownerId,
      { title: entity.title, body: entity.body, tags: entity.tags ?? [] },
      LinkPersistenceMapper.toLinks(entity.links),
      entity.createdAt,
      entity.updatedAt,
    );
  },

  /** The note row only; links come from toLinkEntities. */
  toEntity(note: Note, entity: NoteEntity = new NoteEntity()): NoteEntity {
    const details = note.details;
    entity.id = note.id;
    entity.ownerId = note.ownerId;
    entity.title = details.title;
    entity.body = details.body;
    entity.tags = details.tags;
    delete entity.links;
    return entity;
  },

  toLinkEntities(note: Note): NoteLinkEntity[] {
    return LinkPersistenceMapper.toRows(note.links).map((row) =>
      Object.assign(new NoteLinkEntity(), { noteId: note.id, ...row }),
    );
  },
};
