import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import type { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { EventPublisher, UnitOfWork } from '../../common/application';
import { DatabaseConfig } from '../environments/registers';
import { EventEmitterPublisher } from '../events/event-emitter.publisher';
import { SqlMigrator } from './migrations/sql-migrator';
import { configurePgTypes } from './pg-types';
import { TransactionalManager, TypeOrmUnitOfWork } from './transactions';
import { databaseConfiguration } from './typeorm-configuration.database';

/**
 * Wrapper over TypeORM (pattern of my-self.so): `forRoot` opens the connection once and
 * applies the SQL migrations before anything else runs; feature modules register their
 * entities with `forFeature` instead of importing TypeOrmModule directly.
 */
@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule,
      global: true,
      imports: [
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
            const database = config.getOrThrow<DatabaseConfig>('database');
            return {
              ...databaseConfiguration(database),
              migrationLocations: database.migrationLocations,
            };
          },
          dataSourceFactory: async (options) => {
            configurePgTypes();
            const dataSource = await new DataSource(
              options as DataSourceOptions,
            ).initialize();
            const locations = (
              options as unknown as { migrationLocations?: string[] }
            ).migrationLocations;
            await new SqlMigrator(dataSource, locations ?? []).migrate();
            return dataSource;
          },
        }),
      ],
      providers: [
        TransactionalManager,
        { provide: UnitOfWork, useClass: TypeOrmUnitOfWork },
        { provide: EventPublisher, useClass: EventEmitterPublisher },
      ],
      exports: [
        TypeOrmModule,
        TransactionalManager,
        UnitOfWork,
        EventPublisher,
      ],
    };
  }

  static forFeature(entities: EntityClassOrSchema[]): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [TypeOrmModule.forFeature(entities)],
      exports: [TypeOrmModule],
    };
  }
}
