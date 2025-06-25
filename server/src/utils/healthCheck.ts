import { Pool } from 'pg';
import { DB_CONFIG } from '../config';
import { RedisClient } from './redis';

export async function checkDatabaseConnection(): Promise<boolean> {
  const pool = new Pool(DB_CONFIG);
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (err) {
    return false;
  } finally {
    await pool.end();
  }
}

export async function checkRedisConnection(): Promise<boolean> {
  const { status } = await RedisClient.healthCheck();
  return status === 'healthy';
}