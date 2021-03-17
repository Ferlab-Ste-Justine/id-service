import * as dotenv from 'dotenv';
import * as path from 'path';

import * as pkg from '../package.json';
import { getKeysEndingWith, getOsEnv, getOsEnvOptional, normalizePort, toNumber } from './lib/env';

/**
 * Load .env file or for tests the .env.test file.
 */
dotenv.config({ path: path.join(process.cwd(), `.env${process.env.NODE_ENV === 'test' ? '.test' : ''}`) });

/**
 * Environment variables
 */
export const env = {
    node: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
    isDevelopment: process.env.NODE_ENV === 'development',
    app: {
        name: getOsEnvOptional('APP_NAME', 'Id Service'),
        version: (pkg as any).version,
        description: (pkg as any).description,
        host: getOsEnvOptional('APP_HOST', '0.0.0.0'),
        schema: getOsEnvOptional('APP_SCHEMA', 'http'),
        port: normalizePort(process.env.PORT || getOsEnv('APP_PORT')),
    },
    db: {
        database: getOsEnv('PG_DATABASE'),
        host: getOsEnvOptional('PG_HOST'),
        port: toNumber(getOsEnvOptional('PG_PORT')),
        username: getOsEnvOptional('PG_USERNAME'),
        password: getOsEnvOptional('PG_PASSWORD'),
    },
    entities: {
        prefixes: getKeysEndingWith('_PREFIX'),
        padding: getKeysEndingWith('_PAD'),
        paddingCharacter: getKeysEndingWith('_PAD_CHAR'),
        sequences: getKeysEndingWith('_SEQ'),
    },
};
