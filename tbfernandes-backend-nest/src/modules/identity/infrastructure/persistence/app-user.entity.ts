import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { bigintToNumber } from '../../../../infrastructure/database/audited.entity';

/** identity.app_user has no owner_id: the user is the owner. */
@Entity({ schema: 'identity', name: 'app_user' })
export class AppUserEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('varchar')
  name: string;

  @Column('varchar')
  email: string;

  @Column('varchar')
  locale: string;

  @Column('varchar')
  timeZone: string;

  @Column('varchar', { nullable: true })
  passwordHash: string | null;

  @CreateDateColumn({ type: 'timestamptz', update: false })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @VersionColumn({ type: 'bigint', transformer: bigintToNumber })
  version: number;
}
