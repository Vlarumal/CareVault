import { Pool } from 'pg';
import { migrate } from '../../db/migrate';
import {
  calculatePoolSize,
  getDatabaseConfig,
} from '../../db/dbUtils';

const { connectionString } = getDatabaseConfig();

const defaultPool = new Pool({
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



async function initDatabase() {
  try {
    await migrate();
    console.log('Database initialized successfully');
    console.log(
      'Entry versioning system initialized with application-layer checksums'
    );
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === '3D000') {
      console.log('Database does not exist. Creating database...');

      try {
        await defaultPool.query('CREATE DATABASE patients_test_db');
        console.log('Database created, running migration...');

        await migrate();
        console.log('Database initialized successfully');
      } catch (createError) {
        console.error(
          'Failed to create database or run migrations: ',
          createError
        );
        process.exit(1);
      } finally {
        await defaultPool.end();
      }
    } else {
      console.error('Error initializing database: ', error);
      process.exit(1);
    }
  }
}
initDatabase();
