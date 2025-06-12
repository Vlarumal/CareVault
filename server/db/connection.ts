import { Pool } from 'pg';
import dotenv from 'dotenv';
import os from 'os';
import fs from 'fs';

dotenv.config();

const isTestEnv = process.env.NODE_ENV === 'test';

// Dynamic pool size calculation (cores * 2 + 1)
const calculatePoolSize = () => {
  const coreMultiplier = process.env.DB_POOL_MULTIPLIER 
    ? parseInt(process.env.DB_POOL_MULTIPLIER, 10) 
    : 2;
  return Math.max(2, os.cpus().length * coreMultiplier) + 1;
};

function getDatabaseConfig() {
  const useDocker = process.env.DOCKER_ENV === 'true' || isRunningInDocker();
  
  if (useDocker) {
    return {
      connectionString: isTestEnv
        ? process.env.DOCKER_TEST_DB_URL
        : process.env.DOCKER_DB_URL,
    };
  } else {
    return {
      connectionString: isTestEnv
        ? process.env.TEST_DATABASE_URL
        : process.env.DATABASE_URL,
    };
  }
}

function isRunningInDocker(): boolean {
  try {
    return (
      fs.existsSync('/.dockerenv') ||
      (fs.existsSync('/proc/self/cgroup') &&
        fs.readFileSync('/proc/self/cgroup', 'utf8').includes('docker'))
    );
  } catch (e) {
    return false;
  }
}

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
  allowExitOnIdle: false, // Don't exit process on idle
});

// Connection leak detection
let connectionCount = 0;
pool.on('connect', () => {
  connectionCount++;
  if (connectionCount > pool.options.max) {
    console.warn(`Connection leak detected: ${connectionCount} active connections`);
  }
});

pool.on('remove', () => {
  connectionCount--;
});

// Enhanced error handling
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
