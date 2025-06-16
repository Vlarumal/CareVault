import { patientService } from '../services/patientsService';
import pool from '../../db/connection';
import { clearDatabase, seedDatabase } from './testUtils';

describe('getEntriesByPatientId', () => {
  beforeAll(async () => {
    await clearDatabase();
    await seedDatabase();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should return entries for a patient', async () => {
    // Get a patient ID from the database
    const patientResult = await pool.query('SELECT id FROM patients LIMIT 1');
    const patientId = patientResult.rows[0].id;

    const entries = await patientService.getEntriesByPatientId(patientId);
    
    expect(entries).toBeDefined();
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
    
    // Verify entry structure
    const firstEntry = entries[0];
    expect(firstEntry).toHaveProperty('id');
    expect(firstEntry).toHaveProperty('description');
    expect(firstEntry).toHaveProperty('date');
    expect(firstEntry).toHaveProperty('specialist');
    expect(firstEntry).toHaveProperty('type');
  });
});

describe('validateHealthCheckEntry', () => {
  it('should validate a HealthCheck entry with valid rating', async () => {
    const entry = {
      type: 'HealthCheck',
      description: 'Annual checkup',
      date: '2025-06-16',
      specialist: 'Dr. Smith',
      healthCheckRating: 2
    };
    
    const result = HealthCheckEntrySchema.safeParse(entry);
    expect(result.success).toBe(true);
  });

  it('should validate a HealthCheck entry with missing rating (uses default)', async () => {
    const entry = {
      type: 'HealthCheck',
      description: 'Annual checkup',
      date: '2025-06-16',
      specialist: 'Dr. Smith'
    };
    
    const result = HealthCheckEntrySchema.safeParse(entry);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.healthCheckRating).toBe(0);
    }
  });

  it('should invalidate a HealthCheck entry with out-of-range rating', async () => {
    const entry = {
      type: 'HealthCheck',
      description: 'Annual checkup',
      date: '2025-06-16',
      specialist: 'Dr. Smith',
      healthCheckRating: 5
    };
    
    const result = HealthCheckEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });
});