import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';
import type { LinkTargetType } from './link-target';

/** knowledge.snippet. The generated `search` column is only read by SQL. */
@Entity({ schema: 'knowledge', name: 'snippet' })
export class SnippetEntity extends AuditedEntity {
  @Column('varchar')
  title: string;

  @Column('varchar')
  language: string;

  @Column('text')
  code: string;

  @Column('varchar', { nullable: true })
  explanation: string | null;

  @Column('varchar', { nullable: true })
  sourceUrl: string | null;

  @Column('text', { array: true })
  tags: string[];

  @OneToMany(() => SnippetLinkEntity, (link) => link.snippet)
  links?: SnippetLinkEntity[];
}

@Entity({ schema: 'knowledge', name: 'snippet_link' })
export class SnippetLinkEntity {
  @PrimaryColumn('uuid')
  snippetId: string;

  @PrimaryColumn('text')
  targetType: LinkTargetType;

  @PrimaryColumn('uuid')
  targetId: string;

  @ManyToOne(() => SnippetEntity, (snippet) => snippet.links, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'snippet_id' })
  snippet?: SnippetEntity;
}
