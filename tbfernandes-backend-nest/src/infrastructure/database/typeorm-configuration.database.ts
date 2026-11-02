import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DatabaseConfig } from '../environments/registers';
import { SnakeNamingStrategy } from './snake-naming.strategy';

/** TypeORM never changes the schema: SQL migrations own it (SqlMigrator). */
export const databaseConfiguration = (
  config: DatabaseConfig,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: config.host,
  port: config.port,
  username: config.username,
  password: config.password,
  database: config.database,
  autoLoadEntities: true,
  synchronize: false,
  migrationsRun: false,
  logging: config.logging,
  namingStrategy: new SnakeNamingStrategy(),
  extra: { options: '-c timezone=UTC' },
});
