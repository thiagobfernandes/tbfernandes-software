import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { Snippet, SnippetRepository, SnippetSearch } from '../../domain';
import { SnippetPersistenceMapper as Mapper } from './mappers/snippet.persistence-mapper';
import { SnippetEntity, SnippetLinkEntity } from './snippet.entity';

/** SnippetRepository on TypeORM. Links are rewritten on every save. */
@Injectable()
export class TypeOrmSnippetRepository extends SnippetRepository {
  private readonly rows: BaseRepository<SnippetEntity>;

  constructor(private readonly tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(SnippetEntity, tx);
  }

  private get links() {
    return this.tx.manager.getRepository(SnippetLinkEntity);
  }

  async create(snippet: Snippet): Promise<Snippet> {
    await this.rows.insertEntity(Mapper.toEntity(snippet));
    await this.writeLinks(snippet);
    return (await this.findById(snippet.ownerId, snippet.id))!;
  }

  async save(snippet: Snippet): Promise<Snippet> {
    const existing = await this.rows.findOwned(snippet.ownerId, snippet.id);
    await this.rows.saveEntity(Mapper.toEntity(snippet, existing ?? undefined));
    await this.links.delete({ snippetId: snippet.id });
    await this.writeLinks(snippet);
    return (await this.findById(snippet.ownerId, snippet.id))!;
  }

  async findById(ownerId: string, id: string): Promise<Snippet | null> {
    const entity = await this.rows.findOwned(ownerId, id, { links: true });
    return entity && Mapper.toDomain(entity);
  }

  async search(ownerId: string, search: SnippetSearch): Promise<Snippet[]> {
    const query = this.rows.repository
      .createQueryBuilder('snippet')
      .leftJoinAndSelect('snippet.links', 'link')
      .where('snippet.owner_id = :ownerId', { ownerId });
    if (search.text)
      query.andWhere(
        "(snippet.search @@ plainto_tsquery('simple', :text) OR snippet.title ILIKE '%' || :text || '%')",
        { text: search.text },
      );
    if (search.language)
      query.andWhere('snippet.language = :language', {
        language: search.language,
      });
    if (search.tag)
      query.andWhere(':tag = ANY(snippet.tags)', { tag: search.tag });
    const rows = await query.orderBy('snippet.updated_at', 'DESC').getMany();
    return rows.map((row) => Mapper.toDomain(row));
  }

  async linkedTo(ownerId: string, workItemId: string): Promise<Snippet[]> {
    const rows = await this.rows.repository
      .createQueryBuilder('snippet')
      .leftJoinAndSelect('snippet.links', 'link')
      .where('snippet.owner_id = :ownerId', { ownerId })
      .andWhere(
        'snippet.id IN (SELECT l.snippet_id FROM knowledge.snippet_link l WHERE l.target_id = :workItemId)',
        { workItemId },
      )
      .getMany();
    return rows.map((row) => Mapper.toDomain(row));
  }

  delete(snippet: Snippet): Promise<void> {
    return this.rows.deleteOwned(snippet.ownerId, snippet.id);
  }

  private async writeLinks(snippet: Snippet): Promise<void> {
    const links = Mapper.toLinkEntities(snippet);
    if (links.length) await this.links.insert(links);
  }
}
