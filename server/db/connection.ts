import { Pool } from 'pg';
import dotenv from 'dotenv';
import { calculatePoolSize, getDatabaseConfig } from './dbUtils';

dotenv.config();

const isTestEnv = process.env.NODE_ENV === 'test';

const { connectionString } = getDatabaseConfig();

const pool = new Pool({
  connectionString,
  max: calculatePoolSize(),
  idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT
    ? parseInt(process.env.DB_IDLE_TIMEOUT, 10)
    : 30000,
  connectionTimeoutMillis: process.env.DB_CONN_TIMEOUT
    ? parseInt(process.env.DB_CONN_TIMEOUT, 10)
    : 10000,
  maxUses: 750, // Prevent state accumulation
  allowExitOnIdle: false,
});

let connectionCount = 0;
pool.on('connect', () => {
  connectionCount++;
  if (connectionCount > pool.options.max) {
    console.warn(
      `Connection leak detected: ${connectionCount} active connections`
    );
  }
});

pool.on('remove', () => {
  connectionCount--;
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  if (client) {
    client.release();
  }
});

console.log(`Database pool configured with:
- Max connections: ${pool.options.max}
- Idle timeout: ${pool.options.idleTimeoutMillis}ms
- Connection timeout: ${pool.options.connectionTimeoutMillis}ms
- Environment: ${isTestEnv ? 'test' : 'production/development'}`);

export default pool;
