import pool from '../../db/connection';

export default async () => {
  if (pool) {
    await pool.end();
    console.log('Database pool closed');
  }
};