import axios, { AxiosError } from 'axios';
import { clearDatabase, seedDatabase } from './testUtils';
import pool from '../../db/connection';
import { performance } from 'perf_hooks';
import dotenv from 'dotenv';

dotenv.config()

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
