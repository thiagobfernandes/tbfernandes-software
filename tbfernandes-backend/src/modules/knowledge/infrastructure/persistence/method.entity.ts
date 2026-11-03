import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';
import type { MethodCategory } from '../../domain';

@Entity({ schema: 'knowledge', name: 'method' })
export class MethodEntity extends AuditedEntity {
  @Column('varchar')
  title: string;

  @Column('varchar')
  summary: string;

  @Column('text')
  category: MethodCategory;

  @Column('text', { array: true })
  tags: string[];

  @Column('date')
  lastReviewed: string;

  /** Read through the relations; written by the repository (delete and insert in order). */
  @OneToMany(() => MethodStepEntity, (step) => step.method)
  steps?: MethodStepEntity[];

  @OneToMany(() => MethodExampleEntity, (example) => example.method)
  examples?: MethodExampleEntity[];
}

@Entity({ schema: 'knowledge', name: 'method_step' })
export class MethodStepEntity {
  @PrimaryColumn('uuid')
  methodId: string;

  @PrimaryColumn('int')
  position: number;

  @Column('varchar')
  title: string;

  @Column('varchar', { nullable: true })
  detail: string | null;

  @ManyToOne(() => MethodEntity, (method) => method.steps, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'method_id' })
  method?: MethodEntity;
}

@Entity({ schema: 'knowledge', name: 'method_example' })
export class MethodExampleEntity {
  @PrimaryColumn('uuid')
  methodId: string;

  @PrimaryColumn('int')
  position: number;

  @Column('varchar')
  title: string;

  @Column('text')
  content: string;

  @ManyToOne(() => MethodEntity, (method) => method.examples, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'method_id' })
  method?: MethodEntity;
}
