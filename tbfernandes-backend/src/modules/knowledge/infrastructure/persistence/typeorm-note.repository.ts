import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { Note, NoteRepository } from '../../domain';
import { NotePersistenceMapper as Mapper } from './mappers/note.persistence-mapper';
import { NoteEntity, NoteLinkEntity } from './note.entity';

/** NoteRepository on TypeORM. Links are rewritten on every save. */
@Injectable()
export class TypeOrmNoteRepository extends NoteRepository {
  private readonly rows: BaseRepository<NoteEntity>;

  constructor(private readonly tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(NoteEntity, tx);
  }

  private get links() {
    return this.tx.manager.getRepository(NoteLinkEntity);
  }

  async create(note: Note): Promise<Note> {
    await this.rows.insertEntity(Mapper.toEntity(note));
    await this.writeLinks(note);
    return (await this.findById(note.ownerId, note.id))!;
  }

  async save(note: Note): Promise<Note> {
    const existing = await this.rows.findOwned(note.ownerId, note.id);
    await this.rows.saveEntity(Mapper.toEntity(note, existing ?? undefined));
    await this.links.delete({ noteId: note.id });
    await this.writeLinks(note);
    return (await this.findById(note.ownerId, note.id))!;
  }

  async findById(ownerId: string, id: string): Promise<Note | null> {
    const entity = await this.rows.findOwned(ownerId, id, { links: true });
    return entity && Mapper.toDomain(entity);
  }

  /** Full-text match, plus a match inside the title so partial words still find notes. */
  async search(
    ownerId: string,
    text: string | null,
    tag: string | null,
  ): Promise<Note[]> {
    const query = this.rows.repository
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.links', 'link')
      .where('note.owner_id = :ownerId', { ownerId });
    if (text)
      query.andWhere(
        "(note.search @@ plainto_tsquery('simple', :text) OR note.title ILIKE '%' || :text || '%')",
        { text },
      );
    if (tag) query.andWhere(':tag = ANY(note.tags)', { tag });
    const rows = await query.orderBy('note.updated_at', 'DESC').getMany();
    return rows.map((row) => Mapper.toDomain(row));
  }

  async linkedTo(ownerId: string, workItemId: string): Promise<Note[]> {
    const rows = await this.rows.repository
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.links', 'link')
      .where('note.owner_id = :ownerId', { ownerId })
      .andWhere(
        'note.id IN (SELECT l.note_id FROM knowledge.note_link l WHERE l.target_id = :workItemId)',
        { workItemId },
      )
      .getMany();
    return rows.map((row) => Mapper.toDomain(row));
  }

  delete(note: Note): Promise<void> {
    return this.rows.deleteOwned(note.ownerId, note.id);
  }

  private async writeLinks(note: Note): Promise<void> {
    const links = Mapper.toLinkEntities(note);
    if (links.length) await this.links.insert(links);
  }
}
