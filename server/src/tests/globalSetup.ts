import { migrate } from '../../db/migrate';
import pool from '../../db/connection';

async function setup() {
  // Test database connection using centralized pool
  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    const res = await client.query('SELECT 1');
    console.log('Database connection test successful:', res.rows);
    client.release();
  } catch (err) {
    console.error('Database connection test failed:', err);
    throw err;
  }
  
  // Run migrations to set up test database
  await migrate();
}

export default setup;