import { patientService } from '../services/patientsService';
import pool from '../../db/connection';
import { clearDatabase, seedDatabase } from './testUtils';

describe('getEntriesByPatientId', () => {
  beforeAll(async () => {
    await clearDatabase();
    await seedDatabase();
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