import { Pool } from 'pg';

import config from './index';

export const pool = config.isDevelopment
  ? new Pool({
      user: config.db.username,
      host: config.db.host,
      database: config.db.database,
      password: config.db.password,
      port: config.db.port,
    })
  : new Pool();
