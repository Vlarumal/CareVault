import request from 'supertest';
import app from '../index';

describe('GET /api/metrics', () => {
  it('should return 200 and metrics data', async () => {
    // Trigger a request to the app to generate some metrics
    await request(app).get('/api/ping');

    const response = await request(app).get('/api/metrics');
    expect(response.status).toBe(200);
    expect(response.text).toContain('http_request_duration_seconds');
    expect(response.text).toContain('process_cpu_user_seconds_total');
  });
});