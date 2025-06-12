import axios, { AxiosError } from 'axios';
import { clearDatabase, seedDatabase } from './testUtils';
import pool from '../../db/connection';
import { performance } from 'perf_hooks';
import dotenv from 'dotenv';
import Benchmark from 'benchmark';

dotenv.config();
const baseUrl = process.env.BASE_URL;

describe('Patients API Performance', () => {
  beforeAll(async () => {
    try {
      await clearDatabase();
      await seedDatabase();
    } catch (error) {
      console.error('Setup failed:', error);
      process.exit(1);
    }
  });

  test('should handle load with reasonable response times', async () => {
    const startTime = performance.now();

    // Make multiple requests concurrently
    const requests = Array.from({ length: 10 }, () =>
      axios.get(`${baseUrl}/api/patients`)
    );

    const responses = await Promise.all(requests);
    const endTime = performance.now();

    // Check that all responses are successful
    responses.forEach((response) => {
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(typeof response.data === 'object').toBe(true);
      expect(response.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    // Calculate average response time
    const totalTime = endTime - startTime;
    const averageTime = totalTime / requests.length;

    console.log(`Average response time: ${averageTime.toFixed(2)}ms`);
    console.log(
      `Total time for all requests: ${totalTime.toFixed(2)}ms`
    );

    // Define acceptable performance threshold
    const maxAcceptableTime = 500; // 500ms

    expect(averageTime).toBeLessThan(maxAcceptableTime);
  });

  test('should generate 1000+ patient dataset', async () => {
    const patientCount = 1000;
    await seedDatabase(patientCount);

    // Verify directly in database
    const result = await pool.query('SELECT COUNT(*) FROM patients');
    const count = parseInt(result.rows[0].count, 10);
    expect(count).toBeGreaterThanOrEqual(patientCount);
  }, 30000); // 30s timeout

  test('should measure throughput using benchmark.js', async () => {
    const suite = new Benchmark.Suite();
    let errorCount = 0;

    // Add benchmark test for GET /api/patients
    suite.add('GET /api/patients', {
      defer: true,
      fn: async (deferred: any) => {
        try {
          await axios.get(`${baseUrl}/api/patients`);
          deferred.resolve();
        } catch (error) {
          errorCount++;
          deferred.resolve(); // Still resolve to continue benchmark
        }
      },
    });

    test('should validate connection pool under high load', async () => {
      const connectionLimit = pool.options.max;
      console.log(
        `Testing with connection limit: ${connectionLimit}`
      );

      // Track connection metrics
      let maxConnectionsUsed = 0;
      let connectionLeaks = 0;
      const connectionTracker = new Map();

      // Add connection tracking
      pool.on('connect', (client) => {
        connectionTracker.set(client, { start: Date.now() });
        const currentCount = connectionTracker.size;
        if (currentCount > maxConnectionsUsed)
          maxConnectionsUsed = currentCount;

        // Leak detection
        if (currentCount > connectionLimit) {
          connectionLeaks++;
          console.warn(
            `Connection leak detected: ${currentCount} connections`
          );
        }
      });

      pool.on('remove', (client) => {
        connectionTracker.delete(client);
      });

      // Simulate high connection load
      const concurrentQueries = connectionLimit * 3;
      const queries = Array.from(
        { length: concurrentQueries },
        async (_, _i) => {
          const start = Date.now();
          try {
            const client = await pool.connect();
            // Simulate query processing time
            await new Promise((resolve) => setTimeout(resolve, 50));
            client.release();
            return Date.now() - start;
          } catch (error) {
            return -1; // Connection timeout
          }
        }
      );

      const results = await Promise.all(queries);
      const timeouts = results.filter((time) => time === -1).length;
      const avgAcquisitionTime =
        results
          .filter((time) => time > 0)
          .reduce((sum, time) => sum + time, 0) /
          (results.length - timeouts) || 0;

      console.log(`Connection pool metrics:
    - Max connections used: ${maxConnectionsUsed}/${connectionLimit}
    - Connection timeouts: ${timeouts}/${concurrentQueries}
    - Avg acquisition time: ${avgAcquisitionTime.toFixed(2)}ms
    - Connection leaks detected: ${connectionLeaks}`);

      // Validate pool behavior
      expect(maxConnectionsUsed).toBeLessThanOrEqual(connectionLimit);
      expect(timeouts).toBeLessThan(concurrentQueries * 0.1); // <10% timeouts
      expect(connectionLeaks).toBe(0);
    }, 30000);

    // Run benchmarks
    await new Promise((resolve) => {
      suite
        .on('cycle', (event: any) => {
          console.log(String(event.target));
        })
        .on('complete', () => {
          console.log(
            'Fastest is ' + suite.filter('fastest').map('name')
          );
          resolve(null);
        })
        .on('error', (err: any) => {
          console.error('Benchmark error:', err);
          resolve(null);
        })
        .run({ async: true, queued: true });
    });

    console.log(`Error rate: ${errorCount}/${suite.length} requests`);
    expect(errorCount).toBe(0);
  });

  test('should handle sustained load for 5 minutes', async () => {
    const duration = 5 * 60 * 1000; // 5 minutes
    const startTime = Date.now();
    let requestCount = 0;
    let errorCount = 0;

    while (Date.now() - startTime < duration) {
      try {
        // Alternate between GET and POST requests
        if (requestCount % 2 === 0) {
          await axios.get(`${baseUrl}/api/patients`);
        } else {
          await axios.post(`${baseUrl}/api/patients`, {
            name: `Test Patient ${requestCount}`,
            dateOfBirth: '1990-01-01',
            gender: 'other',
            occupation: 'Tester',
          });
        }
        requestCount++;
      } catch (error) {
        errorCount++;
      }
    }

    console.log(`Completed ${requestCount} requests in 5 minutes`);
    console.log(
      `Error rate: ${((errorCount / requestCount) * 100).toFixed(2)}%`
    );
    expect(errorCount).toBeLessThan(requestCount * 0.05); // <5% error rate
  }, 350000); // 5 min 50 sec timeout

  test('should validate metrics endpoints under load', async () => {
    // Create custom agent to prevent connection pooling issues
    const http = require('http');
    const agent = new http.Agent({ keepAlive: false });

    // Generate load with connection reuse disabled
    const requests = Array.from({ length: 50 }, () =>
      axios
        .get(`${baseUrl}/api/patients`, { httpAgent: agent })
        .catch(() => {})
    );
    await Promise.all(requests);

    // Validate metrics with same agent
    const metricsResponse = await axios.get(
      `${baseUrl}/api/metrics`,
      { httpAgent: agent }
    );
    expect(metricsResponse.status).toBe(200);
    expect(metricsResponse.data).toContain(
      'http_request_duration_seconds'
    );
  });

  test('should handle database connection issues gracefully', async () => {
    // Simulate database connection issue by closing the pool
    await pool.end();

    const startTime = performance.now();
    try {
      await axios.get(`${baseUrl}/api/patients`);
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      const errorResponse = error as AxiosError;
      expect(errorResponse.response?.status).toBe(500);
      expect(errorResponse.response?.data).toHaveProperty('error');

      // Check that error handling is fast
      const maxErrorHandlingTime = 200; // 200ms
      expect(responseTime).toBeLessThan(maxErrorHandlingTime);
    } finally {
      // Create a new pool instead of trying to reconnect
      pool.connect = async () => {
        const newPool = require('../../db/connection');
        return newPool.connect();
      };
    }
  });
});
