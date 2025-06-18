import os from 'os';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const isTestEnv = process.env.NODE_ENV === 'test';

export function getDatabaseConfig() {
  const useDocker =
    process.env.DOCKER_ENV === 'true' || isRunningInDocker();

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
        fs
          .readFileSync('/proc/self/cgroup', 'utf8')
          .includes('docker'))
    );
  } catch (e) {
    return false;
  }
}

// Dynamic pool size calculation (cores * 2 + 1)
export const calculatePoolSize = () => {
  const coreMultiplier = process.env.DB_POOL_MULTIPLIER
    ? parseInt(process.env.DB_POOL_MULTIPLIER, 10)
    : 2;
  return Math.max(2, os.cpus().length * coreMultiplier) + 1;
};

