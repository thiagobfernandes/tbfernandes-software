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

/** knowledge.note. The generated `search` column is only read by SQL. */
@Entity({ schema: 'knowledge', name: 'note' })
export class NoteEntity extends AuditedEntity {
  @Column('varchar')
  title: string;

  @Column('text')
  body: string;

  @Column('text', { array: true })
  tags: string[];

  /** Read through the relation; written by the repository. */
  @OneToMany(() => NoteLinkEntity, (link) => link.note)
  links?: NoteLinkEntity[];
}

@Entity({ schema: 'knowledge', name: 'note_link' })
export class NoteLinkEntity {
  @PrimaryColumn('uuid')
  noteId: string;

  @PrimaryColumn('text')
  targetType: LinkTargetType;

  /** work.project or work.task (other module, no FK). */
  @PrimaryColumn('uuid')
  targetId: string;

  @ManyToOne(() => NoteEntity, (note) => note.links, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'note_id' })
  note?: NoteEntity;
}
