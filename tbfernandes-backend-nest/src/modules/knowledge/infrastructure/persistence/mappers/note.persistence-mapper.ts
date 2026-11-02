import { Note } from '../../../domain';
import { NoteEntity, NoteLinkEntity } from '../note.entity';
import { LinkPersistenceMapper } from './link.persistence-mapper';

/** Note ↔ knowledge.note row and its knowledge.note_link rows. */
export const NotePersistenceMapper = {
  toDomain(e: NoteEntity): Note {
    return Note.restore(
      e.id,
      e.ownerId,
      { title: e.title, body: e.body, tags: e.tags ?? [] },
      LinkPersistenceMapper.toLinks(e.links),
      e.createdAt,
      e.updatedAt,
    );
  },

  /** The note row only; links come from toLinkEntities. */
  toEntity(note: Note, e: NoteEntity = new NoteEntity()): NoteEntity {
    const d = note.details;
    e.id = note.id;
    e.ownerId = note.ownerId;
    e.title = d.title;
    e.body = d.body;
    e.tags = d.tags;
    delete e.links;
    return e;
  },

  toLinkEntities(note: Note): NoteLinkEntity[] {
    return LinkPersistenceMapper.toRows(note.links).map((row) =>
      Object.assign(new NoteLinkEntity(), { noteId: note.id, ...row }),
    );
  },
};
