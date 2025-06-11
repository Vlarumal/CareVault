import pool from "../../db/connection";


/**
 * Test database connectivity
 */
async function testConnection() {
  try {
    console.log('Attempting to connect to the database...');

    // Get a client from the pool
    const client = await pool.connect();
    console.log('Successfully obtained client from pool');

    try {
      // Execute a simple query
      const res = await client.query('SELECT 1');
      console.log('Query successful:', res.rows);

      // Return the client to the pool
      client.release();
      console.log('Client released back to pool');

      console.log('Database connection test PASSED');
    } catch (queryErr) {
      console.error('Query execution failed:', queryErr);
      client.release();
      process.exit(1);
    }
  } catch (connErr) {
    console.error('Database connection failed:', connErr);
    process.exit(1);
  }
}

// Run the test
testConnection().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});