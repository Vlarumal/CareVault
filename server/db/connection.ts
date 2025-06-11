import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isTestEnv = process.env.NODE_ENV === 'test';

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

/**
 * Determine if running inside Docker container
 * @returns {boolean} True if running inside Docker, false otherwise
 */
function isRunningInDocker(): boolean {
  try {
    // Check Docker environment indicators
    const fs = require('fs');
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
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Add error handling to the pool
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  if (client) {
    client.release();
  }
  process.exit(-1);
});

console.log(`Using database in ${isTestEnv ? 'test' : 'production/development'} environment`);

export default pool;
