import { patientService } from '../services/patientsService';
import {
  Gender,
  NewPatientEntryWithoutEntries,
  HealthCheckRating,
  NewEntryWithoutId,
  PatientEntry,
  HealthCheckEntry,
  HospitalEntry,
  OccupationalHealthcareEntry,
} from '../types';
import { clearDatabase, createTestPatient, createTestPatientWithEntries, seedDatabase } from './testUtils';
import pool from '../../db/connection';
import {
  DatabaseError,
  NotFoundError,
  ValidationError,
} from '../utils/errors';
import { v1 as uuid } from 'uuid';

describe('Patients Service', () => {
  beforeAll(async () => {
    try {
      await clearDatabase();
      await seedDatabase();
    } catch (error) {
      console.error('Setup failed:', error);
      process.exit(1);
    }
  });


  test('should get patient by ID', async () => {
    const result = await pool.query(
      'SELECT id FROM patients LIMIT 1'
    );
    const patientId = result.rows[0].id;

    const patient = await patientService.getPatientById(patientId);
    expect(patient).toBeDefined();
    expect(patient.id).toBe(patientId);
  });

  test('should create a new patient', async () => {
    const newPatient: NewPatientEntryWithoutEntries = {
      name: 'John Eod',
      dateOfBirth: '1980-01-01',
      gender: Gender.Male,
      occupation: 'Tester',
    };
    const createdPatient = await patientService.createPatient(
      newPatient
    );
    expect(createdPatient).toBeDefined();
    expect(createdPatient.name).toBe('John Eod');
  });

  test('should get non-sensitive entries', async () => {
    const entries = await patientService.getNonSensitiveEntries();
    expect(entries).toBeDefined();
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0]).toHaveProperty('id');
    expect(entries[0]).toHaveProperty('name');
  });

  it('should return patient with nested entries', async () => {
    // Create test patient with entries
    const patient = await createTestPatientWithEntries(
      {
        name: 'Test Patient',
        dateOfBirth: '1990-01-01',
        gender: Gender.Male,
        occupation: 'Engineer'
      },
      [
        {
          description: 'Health check description',
          date: '2020-01-01',
          specialist: 'Dr. Healthy',
          type: 'HealthCheck',
          healthCheckRating: HealthCheckRating.Healthy
        },
        {
          description: 'Hospital stay description',
          date: '2020-02-01',
          specialist: 'Dr. Hospital',
          type: 'Hospital',
          discharge: {
            date: '2020-02-02',
            criteria: 'Stable'
          }
        },
        {
          description: 'Occupational healthcare description',
          date: '2020-03-01',
          specialist: 'Dr. Work',
          type: 'OccupationalHealthcare',
          employerName: 'Test Employer',
          sickLeave: {
            startDate: '2020-03-03',
            endDate: '2020-03-10'
          }
        }
      ]
    );

    // Retrieve patient with entries from service
    const fullPatient = await patientService.getPatientById(patient.id);
    const entries = await patientService.getEntriesByPatientId(patient.id);
    fullPatient.entries = entries;

    // Verify entries
    expect(fullPatient).toBeDefined();
    expect(fullPatient.entries).toBeDefined();
    expect(fullPatient.entries).toHaveLength(3);

    // Verify HealthCheck entry
    const healthCheckEntry = fullPatient.entries?.find(e => e.type === 'HealthCheck');
    expect(healthCheckEntry).toBeDefined();
    expect(healthCheckEntry?.type).toBe('HealthCheck');
    expect((healthCheckEntry as HealthCheckEntry).healthCheckRating).toBe(HealthCheckRating.Healthy);

    // Verify Hospital entry
    const hospitalEntry = fullPatient.entries?.find(e => e.type === 'Hospital');
    expect(hospitalEntry).toBeDefined();
    expect(hospitalEntry?.type).toBe('Hospital');
    expect((hospitalEntry as HospitalEntry).discharge).toBeDefined();
    expect((hospitalEntry as HospitalEntry).discharge?.date).toBe('2020-02-02');

    // Verify OccupationalHealthcare entry
    const occupationalEntry = fullPatient.entries?.find(e => e.type === 'OccupationalHealthcare');
    expect(occupationalEntry).toBeDefined();
    expect(occupationalEntry?.type).toBe('OccupationalHealthcare');
    expect((occupationalEntry as OccupationalHealthcareEntry).employerName).toBe('Test Employer');
    expect((occupationalEntry as OccupationalHealthcareEntry).sickLeave).toBeDefined();
    expect((occupationalEntry as OccupationalHealthcareEntry).sickLeave?.startDate).toBe('2020-03-03');
    expect((occupationalEntry as OccupationalHealthcareEntry).sickLeave?.endDate).toBe('2020-03-10');
  });

  describe('addEntry', () => {
    let patients: PatientEntry[];

    beforeEach(async () => {
      const result = await pool.query(
        'SELECT * FROM patients LIMIT 1'
      );
      patients = result.rows as PatientEntry[];
    });

    test('should validate required fields', async () => {
      const patient = patients[0];
      const invalidDescription = {
        description: '',
        date: '2020-01-01',
        specialist: 'Dr. Test',
        type: 'HealthCheck',
        healthCheckRating: HealthCheckRating.Healthy,
      } as NewEntryWithoutId;
      await expect(
        patientService.addEntry(patient, invalidDescription)
      ).rejects.toThrow(ValidationError);

      const invalidDate = {
        description: 'Test',
        date: 'invalid-date',
        specialist: 'Dr. Test',
        type: 'HealthCheck',
        healthCheckRating: HealthCheckRating.Healthy,
      } as NewEntryWithoutId;
      await expect(
        patientService.addEntry(patient, invalidDate)
      ).rejects.toThrow(ValidationError);

      const invalidSpecialist = {
        description: 'Test',
        date: '2020-01-01',
        specialist: '',
        type: 'HealthCheck',
        healthCheckRating: HealthCheckRating.Healthy,
      } as NewEntryWithoutId;
      await expect(
        patientService.addEntry(patient, invalidSpecialist)
      ).rejects.toThrow(ValidationError);
    });

    test('should validate HealthCheck rating', async () => {
      const patient = patients[0];
      const invalidHigh = {
        description: 'Test',
        date: '2020-01-01',
        specialist: 'Dr. Test',
        type: 'HealthCheck',
        healthCheckRating: 5,
      } as unknown as NewEntryWithoutId;
      await expect(
        patientService.addEntry(patient, invalidHigh)
      ).rejects.toThrow(ValidationError);

      const invalidLow = {
        description: 'Test',
        date: '2020-01-01',
        specialist: 'Dr. Test',
        type: 'HealthCheck',
        healthCheckRating: -1,
      } as unknown as NewEntryWithoutId;
      await expect(
        patientService.addEntry(patient, invalidLow)
      ).rejects.toThrow(ValidationError);
    });

    test('should validate missing HealthCheck rating', async () => {
      const patient = patients[0];
      const missingRating = {
        description: 'Test',
        date: '2020-01-01',
        specialist: 'Dr. Test',
        type: 'HealthCheck',
        healthCheckRating: undefined,
      } as unknown as NewEntryWithoutId;
      await expect(
        patientService.addEntry(patient, missingRating)
      ).rejects.toThrow(
        'Missing healthCheckRating for HealthCheck entry'
      );
    });

    test('should validate entry type', async () => {
      const patient = patients[0];
      const invalidEntry = {
        description: 'Test',
        date: '2020-01-01',
        specialist: 'Dr. Test',
        type: 'InvalidType',
        healthCheckRating: HealthCheckRating.Healthy,
      } as unknown as NewEntryWithoutId;
      await expect(
        patientService.addEntry(patient, invalidEntry)
      ).rejects.toThrow(ValidationError);
    });
    
    describe('Entry Management', () => {
      let patient: PatientEntry;
      let entryId: string;
    
      beforeEach(async () => {
        // Create a test patient with one entry
        patient = await createTestPatientWithEntries(
          {
            name: 'Entry Test Patient',
            dateOfBirth: '1995-05-05',
            gender: Gender.Female,
            occupation: 'Tester'
          },
          [{
            description: 'Initial checkup',
            date: '2023-01-01',
            specialist: 'Dr. Initial',
            type: 'HealthCheck',
            healthCheckRating: HealthCheckRating.Healthy
          }]
        );
        entryId = patient.entries![0].id;
      });
    
      test('should update an existing entry', async () => {
        const updateData: NewEntryWithoutId = {
          description: 'Updated checkup',
          date: '2023-01-02',
          specialist: 'Dr. Updated',
          type: 'HealthCheck',
          healthCheckRating: HealthCheckRating.LowRisk
        };
    
        const updatedEntry = await patientService.updateEntry(patient.id, entryId, updateData) as HealthCheckEntry;
        expect(updatedEntry.description).toBe('Updated checkup');
        expect(updatedEntry.healthCheckRating).toBe(HealthCheckRating.LowRisk);
    
        // Verify update in database
        const patientAfterUpdate = await patientService.getPatientById(patient.id);
        const entry = patientAfterUpdate.entries!.find(e => e.id === entryId);
        expect(entry?.description).toBe('Updated checkup');
      });
    
      test('should delete an entry', async () => {
        await patientService.deleteEntry(patient.id, entryId);
        
        // Verify deletion
        const patientAfterDelete = await patientService.getPatientById(patient.id);
        expect(patientAfterDelete.entries).toHaveLength(0);
      });
    
    });
    
    describe('Pagination', () => {
      beforeAll(async () => {
        await clearDatabase();
        // Create 25 test patients
        for (let i = 0; i < 25; i++) {
          await createTestPatient({
            id: uuid(),
            name: `Patient ${i}`,
            dateOfBirth: '1990-01-01',
            gender: Gender.Other,
            occupation: `Occupation ${i}`
          });
        }
      });
    
      test('should return paginated results', async () => {
        const page1 = await patientService.getPaginatedNonSensitiveEntries(1, 10);
        expect(page1.data).toHaveLength(10);
        expect(page1.metadata.totalItems).toBe(25);
        expect(page1.metadata.totalPages).toBe(3);
    
        const page3 = await patientService.getPaginatedNonSensitiveEntries(3, 10);
        expect(page3.data).toHaveLength(5);
      });
    
      test('should handle invalid page parameters', async () => {
        await expect(
          patientService.getPaginatedNonSensitiveEntries(0, 10)
        ).rejects.toThrow(ValidationError);
    
        await expect(
          patientService.getPaginatedNonSensitiveEntries(1, 0)
        ).rejects.toThrow(ValidationError);
      });
    });
    
    describe('Validation Edge Cases', () => {
      let patient: PatientEntry;
    
      beforeEach(async () => {
        const result = await pool.query('SELECT id FROM patients LIMIT 1');
        patient = await patientService.getPatientById(result.rows[0].id);
      });
    
      test('should reject invalid diagnosis codes', async () => {
        const entry: NewEntryWithoutId = {
          description: 'Invalid codes',
          date: '2020-01-01',
          specialist: 'Dr. Test',
          type: 'HealthCheck',
          healthCheckRating: HealthCheckRating.Healthy,
          diagnosisCodes: ['INVALID-CODE', 'A1.2'] // Invalid formats
        };

        await expect(
          patientService.addEntry(patient, entry)
        ).rejects.toThrow(ValidationError);
      });
    
      test('should reject missing discharge criteria for hospital entry', async () => {
        const entry: NewEntryWithoutId = {
          description: 'Missing discharge',
          date: '2020-01-01',
          specialist: 'Dr. Test',
          type: 'Hospital',
          discharge: {
            date: '2020-01-02',
            criteria: '' // Invalid empty
          }
        };
    
        await expect(
          patientService.addEntry(patient, entry)
        ).rejects.toThrow(ValidationError);
      });
    });

    test('should add HealthCheck entry', async () => {
      const patient = patients[0];
      const entry: NewEntryWithoutId = {
        description: 'Test',
        date: '2020-01-01',
        specialist: 'Dr. Test',
        type: 'HealthCheck',
        healthCheckRating: HealthCheckRating.Healthy,
        diagnosisCodes: [],
      };
      const result = await patientService.addEntry(patient, entry);
      expect(result).toBeDefined();
      expect(result.type).toBe('HealthCheck');
      expect((result as HealthCheckEntry).healthCheckRating).toBe(
        HealthCheckRating.Healthy
      );
      // Verify entry was actually added
      const updatedPatient = await patientService.getPatientById(patient.id);
      expect(updatedPatient.entries).toContainEqual(expect.objectContaining({
        type: 'HealthCheck',
        description: 'Test'
      }));
    });

    test('should add Hospital entry', async () => {
      const patient = patients[0];
      const entry: NewEntryWithoutId = {
        description: 'Test',
        date: '2020-01-01',
        specialist: 'Dr. Test',
        type: 'Hospital',
        discharge: {
          date: '2020-01-02',
          criteria: 'Test criteria',
        },
        diagnosisCodes: [],
      };
      const result = await patientService.addEntry(patient, entry);
      expect(result).toBeDefined();
      expect(result.type).toBe('Hospital');
      expect((result as HospitalEntry).discharge).toBeDefined();
      // Verify entry was actually added
      const updatedPatient = await patientService.getPatientById(patient.id);
      expect(updatedPatient.entries).toContainEqual(expect.objectContaining({
        type: 'Hospital',
        description: 'Test'
      }));
    });

    test('should add OccupationalHealthcare entry', async () => {
      const patient = patients[0];
      const entry: NewEntryWithoutId = {
        description: 'Test',
        date: '2020-01-01',
        specialist: 'Dr. Test',
        type: 'OccupationalHealthcare',
        employerName: 'Test Employer',
        sickLeave: {
          startDate: '2020-01-02',
          endDate: '2020-01-03',
        },
        diagnosisCodes: [],
      };
      const result = await patientService.addEntry(patient, entry);
      expect(result).toBeDefined();
      expect(result.type).toBe('OccupationalHealthcare');
      expect(
        (result as OccupationalHealthcareEntry).employerName
      ).toBe('Test Employer');
      // Verify entry was actually added
      const updatedPatient = await patientService.getPatientById(patient.id);
      expect(updatedPatient.entries).toContainEqual(expect.objectContaining({
        type: 'OccupationalHealthcare',
        description: 'Test'
      }));
    });
  });

  describe('deletePatient', () => {
    let patientId: string;

    beforeEach(async () => {
      // Create test patient using helper
      const patient = await createTestPatientWithEntries(
        {
          name: 'Patient to delete',
          dateOfBirth: '1990-01-01',
          gender: Gender.Male,
          occupation: 'Test Occupation'
        },
        []
      );
      patientId = patient.id;
    });

    test('should delete an existing patient', async () => {
      await patientService.deletePatient(patientId);
      // Verify deletion by trying to fetch the patient
      await expect(
        patientService.getPatientById(patientId)
      ).rejects.toThrow(NotFoundError);
    });

    test('should throw NotFoundError for non-existent id', async () => {
      const nonExistentId = uuid();
      await expect(
        patientService.deletePatient(nonExistentId)
      ).rejects.toThrow(NotFoundError);
    });

    test('should throw NotFoundError with correct message for non-existent id', async () => {
      const nonExistentId = uuid();
      try {
        await patientService.deletePatient(nonExistentId);
        fail('Expected NotFoundError but no error was thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
        if (error instanceof NotFoundError) {
          expect(error.message).toContain(`Patient with ID ${nonExistentId} not found`);
        }
      }
    });

    test('should delete patient with entries', async () => {
      // Add an entry to the patient
      const entry: NewEntryWithoutId = {
        description: 'Test entry',
        date: '2020-01-01',
        specialist: 'Dr. Test',
        type: 'HealthCheck',
        healthCheckRating: HealthCheckRating.Healthy,
        diagnosisCodes: [],
      };
      // Add entry to get a valid UUID (ignore the result since we just need the entry to exist)
      await patientService.addEntry(
        await patientService.getPatientById(patientId),
        entry
      );

      await patientService.deletePatient(patientId);

      await expect(
        patientService.getPatientById(patientId)
      ).rejects.toThrow(NotFoundError);
      const entries = await patientService.getEntriesByPatientId(
        patientId
      );
      expect(entries).toHaveLength(0);
    });
  });

  describe('editPatient', () => {
    let patientId: string;

    beforeAll(async () => {
      // Create a patient to edit
      const newPatient: NewPatientEntryWithoutEntries = {
        name: 'Original Name',
        dateOfBirth: '1990-01-01',
        gender: Gender.Male,
        occupation: 'Original Occupation',
      };
      const createdPatient = await patientService.createPatient(
        newPatient
      );
      patientId = createdPatient.id;
    });

    test('should update patient fields and preserve dateOfBirth', async () => {
      const updates = {
        name: 'Updated Name',
        occupation: 'Updated Occupation',
      };
      const updatedPatient = await patientService.editPatient(
        patientId,
        updates
      );
      expect(updatedPatient.name).toBe(updates.name);
      expect(updatedPatient.occupation).toBe(updates.occupation);
      // Verify dateOfBirth remains unchanged
      expect(updatedPatient.dateOfBirth).toBe('1990-01-01');
      expect(updatedPatient.gender).toBe(Gender.Male);
    });

    test('should throw NotFoundError for non-existent id', async () => {
      const nonExistentId = uuid();
      await expect(
        patientService.editPatient(nonExistentId, {
          name: 'New Name',
        })
      ).rejects.toThrow(NotFoundError);
    });

    test('should validate date format', async () => {
      await expect(
        patientService.editPatient(patientId, {
          dateOfBirth: 'invalid-date',
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should handle database errors', async () => {
      // Mock pool.query to simulate database error
      const originalQuery = pool.query;
      pool.query = jest
        .fn()
        .mockRejectedValue(new Error('Database connection error'));

      await expect(
        patientService.editPatient(patientId, {
          name: 'New Name',
        })
      ).rejects.toThrow(DatabaseError);

      // Restore original query method
      pool.query = originalQuery;
    });
  });
  describe('SQL Injection Protection', () => {
    test('should prevent SQL injection in getPatientById', async () => {
      const maliciousId = "1'; DROP TABLE patients; --";
      await expect(patientService.getPatientById(maliciousId))
        .rejects.toThrow(ValidationError);
    });

    test('should prevent SQL injection in createPatient', async () => {
      const maliciousPatient: NewPatientEntryWithoutEntries = {
        name: "Robert'); DROP TABLE patients; --",
        dateOfBirth: '1990-01-01',
        gender: Gender.Male,
        occupation: 'Hacker'
      };
      await expect(patientService.createPatient(maliciousPatient))
        .rejects.toThrow(ValidationError);
    });

    test('should prevent SQL injection in addEntry', async () => {
      const patient = await createTestPatientWithEntries(
        {
          name: 'Test Patient',
          dateOfBirth: '1990-01-01',
          gender: Gender.Male,
          occupation: 'Engineer'
        },
        []
      );
      
      const maliciousEntry: NewEntryWithoutId = {
        description: "Malicious'); DROP TABLE entries; --",
        date: '2020-01-01',
        specialist: 'Dr. Test',
        type: 'HealthCheck',
        healthCheckRating: HealthCheckRating.Healthy
      };
      
      await expect(patientService.addEntry(patient, maliciousEntry))
        .rejects.toThrow(ValidationError);
    });
  });
});
