import {
  Column,
  CreateDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export const bigintToNumber = {
  to: (value?: number) => value,
  from: (value: string | number | null) =>
    value == null ? value : Number(value),
};

/**
 * Columns every aggregate-root table has: id, owner_id, created_at, updated_at and version
 * (optimistic lock). Only infrastructure code sees entities; mappers turn them into domain
 * objects.
 */
export abstract class AuditedEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid', update: false })
  ownerId: string;

  @CreateDateColumn({ type: 'timestamptz', update: false })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @VersionColumn({ type: 'bigint', transformer: bigintToNumber })
  version: number;
}
