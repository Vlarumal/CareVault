import pool from '../../db/connection';

export async function releaseAllConnections() {
  try {
    await pool.end();
    console.log('Database pool ended successfully');
  } catch (error) {
    console.error('Error ending database pool:', error);
  }
}

export async function withConnection(callback: (client: any) => Promise<void>) {
  const client = await pool.connect();
  try {
    await callback(client);
  } catch (error) {
    console.error('Database operation failed:', error);
    throw error;
  } finally {
    client.release();
  }
}