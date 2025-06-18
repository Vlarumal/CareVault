import logger from './utils/logger';
import { PoolConfig } from 'pg';

interface AppConfig {
  allowedOrigins: string[];
  env: 'development' | 'production' | 'test';
  [key: string]: unknown;
}

export const DB_CONFIG: PoolConfig = {
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5433,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'patients_db',
};

/**
 * Application configuration with environment variables
 *
 * Required ENV vars:
 * - APP_URL: Frontend application URL
 * - ADMIN_URL: Admin interface URL
 * - NODE_ENV: Runtime environment
 */
const config: AppConfig = {
  allowedOrigins: [
    process.env.APP_URL || 'http://localhost:3001',
    process.env.ADMIN_URL || 'http://localhost:3001',
    'http://localhost:5173'
  ],
  env: (process.env.NODE_ENV as AppConfig['env']) || 'development'
};

if (config.env === 'production') {
  if (!process.env.APP_URL) {
    throw new Error('APP_URL environment variable is required in production');
  }
  if (!process.env.ADMIN_URL) {
    throw new Error('ADMIN_URL environment variable is required in production');
  }
}

let currentConfig = config;

if (process.env.NODE_ENV === 'development') {
  const configPath = require('path').join(__dirname, 'config.ts');
  require('fs').watchFile(configPath, () => {
    try {
      delete require.cache[require.resolve('./config')];
      currentConfig = require('./config').default;
      logger.info('Configuration reloaded');
    } catch (err) {
      logger.error('Failed to reload config', { error: err });
    }
  });
}

export default currentConfig;