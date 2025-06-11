import pool from '../../db/connection';

export default async function globalTeardown() {
  try {
    await pool.end();
    console.log('Database connection pool closed successfully');
  } catch (err) {
    console.error('Error closing database connection pool:', err);
  }
}