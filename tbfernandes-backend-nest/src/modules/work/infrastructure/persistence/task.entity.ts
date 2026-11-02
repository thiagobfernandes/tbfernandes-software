import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';
import type { TaskPriority, TaskStatus } from '../../domain';

@Entity({ schema: 'work', name: 'task' })
export class TaskEntity extends AuditedEntity {
  @Column('varchar')
  title: string;

  @Column('varchar', { nullable: true })
  description: string | null;

  @Column('uuid', { nullable: true })
  projectId: string | null;

  @Column('text')
  status: TaskStatus;

  @Column('text')
  priority: TaskPriority;

  @Column('varchar', { nullable: true })
  tag: string | null;

  @Column('date', { nullable: true })
  startDate: string | null;

  @Column('date', { nullable: true })
  dueDate: string | null;

  @Column('varchar', { nullable: true })
  doneCriteria: string | null;

  @Column('int', { nullable: true })
  checklistDone: number | null;

  @Column('int', { nullable: true })
  checklistTotal: number | null;

  /** goals.goal (other module, no FK). */
  @Column('uuid', { nullable: true })
  goalId: string | null;

  @Column('timestamptz', { nullable: true })
  completedAt: Date | null;

  /** Read through the relation; written by the repository (delete and insert in order). */
  @OneToMany(() => TaskChecklistItemEntity, (item) => item.task)
  checklistItems?: TaskChecklistItemEntity[];
}

@Entity({ schema: 'work', name: 'task_checklist_item' })
export class TaskChecklistItemEntity {
  @PrimaryColumn('uuid')
  taskId: string;

  @PrimaryColumn('int')
  position: number;

  @Column('uuid')
  id: string;

  @Column('varchar')
  title: string;

  @Column('boolean')
  done: boolean;

  @ManyToOne(() => TaskEntity, (task) => task.checklistItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_id' })
  task?: TaskEntity;
}
