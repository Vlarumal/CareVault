import axios from 'axios';
import { clearDatabase, seedDatabase } from './testUtils';
import dotenv from 'dotenv';

dotenv.config();

const baseUrl = process.env.BASE_URL;

describe('Security Headers', () => {
  beforeAll(async () => {
    await clearDatabase();
    await seedDatabase();
  });

  test('should include security headers in all responses', async () => {
    const response = await axios.get(`${baseUrl}/api/patients`);
    
    expect(response.headers).toHaveProperty('x-dns-prefetch-control', 'off');
    expect(response.headers).toHaveProperty('x-frame-options', 'SAMEORIGIN');
    expect(response.headers).toHaveProperty('strict-transport-security');
    expect(response.headers).toHaveProperty('x-download-options', 'noopen');
    expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
    expect(response.headers).toHaveProperty('x-xss-protection', '0');
    expect(response.headers).toHaveProperty('referrer-policy', 'no-referrer');
    expect(response.headers).toHaveProperty('content-security-policy');
  });

  test('should include security headers for patient details endpoint', async () => {
    // Get a valid patient ID
    const patientsResponse = await axios.get(`${baseUrl}/api/patients`);
    const patientId = patientsResponse.data.data[0].id;
    
    const response = await axios.get(`${baseUrl}/api/patients/${patientId}`);
    
    expect(response.headers).toHaveProperty('x-dns-prefetch-control', 'off');
    expect(response.headers).toHaveProperty('x-frame-options', 'SAMEORIGIN');

    expect(response.headers).toHaveProperty('strict-transport-security');
    
    expect(response.headers).toHaveProperty('x-download-options', 'noopen');
    expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
    expect(response.headers).toHaveProperty('x-xss-protection', '0');
    expect(response.headers).toHaveProperty('referrer-policy', 'no-referrer');
    expect(response.headers).toHaveProperty('content-security-policy');
  });

  test('should include security headers for non-existent routes', async () => {
    try {
      await axios.get(`${baseUrl}/api/non-existent-route`);
    } catch (error: any) {
      const response = error.response;
      expect(response.headers).toHaveProperty('x-dns-prefetch-control', 'off');
      expect(response.headers).toHaveProperty('x-frame-options', 'SAMEORIGIN');
      expect(response.headers).toHaveProperty('strict-transport-security');
      expect(response.headers).toHaveProperty('x-download-options', 'noopen');
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-xss-protection', '0');
      expect(response.headers).toHaveProperty('referrer-policy', 'no-referrer');
      expect(response.headers).toHaveProperty('content-security-policy');
    }
  });
});