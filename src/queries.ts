import { Pool } from 'pg';
import { env } from './env';

export const connectionPool = env.isDevelopment
    ? new Pool({
          user: env.db.username,
          host: env.db.host,
          database: env.db.database,
          password: env.db.password,
          port: env.db.port,
      })
    : new Pool();
