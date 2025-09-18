// config/index.ts

import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { dbConfig } from './database'; // Now this import works
import type { DataSourceOptions } from 'typeorm';
// import type { DataSourceOptions } from 'typeorm';

interface iConfig {
  env: string;
  port: number;
  database: DataSourceOptions;
  keys: {
    privateKey: string;
    publicKey: string;
  };
}

export default (): Partial<iConfig> => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  keys: {
    privateKey: process.env.PRIVATE_KEY.replace(/\\n/gm, '\n'),
    publicKey: process.env.PUBLIC_KEY.replace(/\\n/gm, '\n'),
  },
  database: dbConfig, // Use the exported config directly
});
// import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
// import { dbConfig } from './database';

// interface iConfig {
//   env: string;
//   port: number;
//   database: PostgresConnectionOptions;
//   keys: {
//     privateKey: string;
//     publicKey: string;
//   };
// }

// export default (): Partial<iConfig> => ({
//   env: process.env.NODE_ENV || 'development',
//   port: parseInt(process.env.PORT, 10) || 3000,
//   keys: {
//     privateKey: process.env.PRIVATE_KEY.replace(/\\n/gm, '\n'),
//     publicKey: process.env.PUBLIC_KEY.replace(/\\n/gm, '\n'),
//   },
//   postgres: dbConfig,
// });
