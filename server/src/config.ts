import logger from './utils/logger';
import { PoolConfig } from 'pg';
// import fs from 'fs';
// import path from 'path';

interface AppConfig {
  allowedOrigins: string[];
  env: 'development' | 'production' | 'test';
  [key: string]: unknown;
}

/**
 * Loads a secret from Docker secrets or falls back to environment variable
 * @param secretName Name of the secret (will be uppercased for env var fallback)
 * @returns The secret value
 * @throws Error if secret is not found in either location
 */
// function loadSecret(secretName: string): string {
//   const secretPath = path.join('/run/secrets', secretName);
//   try {
//     if (fs.existsSync(secretPath)) {
//       return fs.readFileSync(secretPath, 'utf8').trim();
//     }
//   } catch (err) {
//     logger.warn(`Failed to read Docker secret ${secretName}`, { error: err });
//   }

//   const envVar = process.env[secretName.toUpperCase()];
//   if (envVar) {
//     return envVar;
//   }

//   throw new Error(`Missing required secret: ${secretName}`);
// }

export const DB_CONFIG: PoolConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // password: loadSecret('db_password'), // for docker
  database: process.env.DB_NAME,
};

if (!process.env.DB_HOST
   || !process.env.DB_USER
  //  || !process.env.DB_PASSWORD
   || !process.env.DB_NAME) {
  throw new Error('Missing required database configuration in environment variables');
}

/**
 * Application configuration with environment variables and Docker secrets
 *
 * Required ENV vars:
 * - APP_URL: Frontend application URL
 * - ADMIN_URL: Admin interface URL
 * - NODE_ENV: Runtime environment
 *
 * Required Secrets (either in /run/secrets or ENV):
 * - db_password
 * - jwt_private_key
 * - jwt_public_key
 * - jwt_refresh_secret
 * - mail_smtp_pass
 * - auth_test_token
 */
const config: AppConfig = {
  allowedOrigins: [
    process.env.APP_URL || 'http://localhost:3001',
    process.env.ADMIN_URL || 'http://localhost:3001',
    'http://localhost:5173'
  ],
  env: (process.env.NODE_ENV as AppConfig['env']) || 'development',
  disableEmailVerification: process.env.DISABLE_EMAIL_VERIFICATION === 'true',
  // jwtPrivateKey: loadSecret('jwt_private_key'),
  // jwtPublicKey: loadSecret('jwt_public_key'),
  // jwtRefreshSecret: loadSecret('jwt_refresh_secret'),
  // mailSmtpPass: loadSecret('mail_smtp_pass'),
  // authTestToken: loadSecret('auth_test_token')
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