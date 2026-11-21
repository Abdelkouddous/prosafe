import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Runtime (Nest) database configuration.
 * The schema is managed exclusively by migrations (`synchronize` is always false);
 * compiled migrations in dist/migrations are applied automatically at boot.
 */
export const dbConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  migrationsRun: true,
  ssl:
    process.env.POSTGRES_SSL === 'true'
      ? {
          rejectUnauthorized: false, // This allows self-signed certificates
        }
      : false,
};
