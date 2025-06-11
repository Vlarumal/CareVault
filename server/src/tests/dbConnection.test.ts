import pool from '../../db/connection';

describe('Database Connection', () => {
  test('should connect to the test database', async () => {
    console.log('pool', pool)
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT 1');
      expect(res.rows[0]).toEqual({ '?column?': 1 });
    } finally {
      client.release();
    }
  }, 10000);
});