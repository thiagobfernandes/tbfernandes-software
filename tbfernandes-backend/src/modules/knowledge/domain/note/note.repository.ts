import { Note } from './note';

export abstract class NoteRepository {
  abstract create(note: Note): Promise<Note>;
  abstract save(note: Note): Promise<Note>;
  abstract findById(ownerId: string, id: string): Promise<Note | null>;
  /** text matches title and body (full text, KNW-04); tag matches exactly; both optional. */
  abstract search(
    ownerId: string,
    text: string | null,
    tag: string | null,
  ): Promise<Note[]>;
  abstract linkedTo(ownerId: string, workItemId: string): Promise<Note[]>;
  abstract delete(note: Note): Promise<void>;
}
