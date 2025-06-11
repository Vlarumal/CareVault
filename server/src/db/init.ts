import pool from '../../db/connection';
import { migrate } from '../../db/migrate';

async function initDatabase() {
  try {
    // Run migration
    await migrate();
    console.log('Database initialized successfully');
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === '28P01') {
      // Database doesn't exist yet, create it
      console.log('Creating database...');
      await pool.query('CREATE DATABASE patients_db');
      console.log('Database created, running migration...');
      await migrate();
      console.log('Database initialized successfully');
    } else {
      console.error('Error initializing database:', error);
      process.exit(1);
    }
  }
}

initDatabase();