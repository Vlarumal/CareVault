import { patientService } from '../services/patientsService';
import pool from '../../db/connection';
import { NotFoundError } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';

describe('Soft Delete Integration', () => {
  const testPatientId = uuidv4();
  const testUserId = uuidv4();
  const deletionReason = 'Test deletion';

  beforeAll(async () => {
    await pool.query(
      `INSERT INTO users (id, email, password_hash, role, name)
       VALUES ($1, $2, $3, $4, $5)`,
      [testUserId, 'test@example.com', 'hashed_password', 'admin', 'Test User']
    );

    await pool.query(
      `INSERT INTO patients (id, name, occupation, gender, ssn, date_of_birth)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [testPatientId, 'Test Patient', 'Tester', 'male', '123-45-6789', '1990-01-01']
    );
  });

  afterAll(async () => {
    await pool.query('DELETE FROM patient_deletion_audit WHERE patient_id = $1', [testPatientId]);
    await pool.query('DELETE FROM patients WHERE id = $1', [testPatientId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  test('should soft delete patient and create audit trail', async () => {
    await patientService.deletePatient(testPatientId, testUserId, deletionReason);

    const patientResult = await pool.query(
      'SELECT is_deleted, deleted_at, deleted_by FROM patients WHERE id = $1',
      [testPatientId]
    );
    
    expect(patientResult.rows[0].is_deleted).toBe(true);
    expect(patientResult.rows[0].deleted_at).not.toBeNull();
    expect(patientResult.rows[0].deleted_by).toBe(testUserId);

    const auditResult = await pool.query(
      'SELECT * FROM patient_deletion_audit WHERE patient_id = $1',
      [testPatientId]
    );
    
    expect(auditResult.rows.length).toBe(1);
    expect(auditResult.rows[0].deleted_by).toBe(testUserId);
    expect(auditResult.rows[0].reason).toBe(deletionReason);
  });

  test('should not return soft-deleted patients in queries', async () => {
    try {
      await patientService.getPatientById(testPatientId);
      fail('Should throw NotFoundError for soft-deleted patient');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundError);
    }
  });
});