import { patientService } from '../services/patientsService';
import pool from '../../db/connection';
import { clearDatabase, seedDatabase } from './testUtils';
import { QueryResult } from 'pg';
import { v1 as uuid } from 'uuid';

jest.mock('../services/patientsService', () => {
  const originalModule = jest.requireActual(
    '../services/patientsService'
  );
  return {
    ...originalModule,
    getEntriesByPatientId: jest.fn().mockResolvedValue([]),
  };
});

import {
  Patient,
  NonSensitivePatientEntry,
  NewPatientEntryWithoutEntries,
  Gender,
} from '../types';
import { NotFoundError } from '../utils/errors';

jest.mock('../../db/connection');
jest.mock('../utils/queryBuilder');

describe('PatientService', () => {
  beforeAll(async () => {
    await clearDatabase();
    await seedDatabase();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getNonSensitiveEntries', () => {
    it('should return a list of non-sensitive patients', async () => {
      const mockPatients: NonSensitivePatientEntry[] = [
        {
          id: '1',
          name: 'John Doe',
          dateOfBirth: '1980-01-01',
          gender: Gender.Male,
          occupation: 'Developer',
          healthRating: 85,
        },
        {
          id: '2',
          name: 'Jane Smith',
          dateOfBirth: '1990-01-01',
          gender: Gender.Female,
          occupation: 'Designer',
          healthRating: 90,
        },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          {
            id: '1',
            name: 'John Doe',
            date_of_birth: '1980-01-01',
            gender: 'male',
            occupation: 'Developer',
            health_rating: 85,
          },
          {
            id: '2',
            name: 'Jane Smith',
            date_of_birth: '1990-01-01',
            gender: 'female',
            occupation: 'Designer',
            health_rating: 90,
          },
        ],
      } as unknown as QueryResult);

      const result = await patientService.getNonSensitiveEntries();
      expect(result).toEqual(mockPatients);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT')
      );
    });

    it('should handle empty result set', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      } as unknown as QueryResult);

      const result = await patientService.getNonSensitiveEntries();
      expect(result).toEqual([]);
    });

    it('should throw an error when database query fails', async () => {
      const error = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        patientService.getNonSensitiveEntries()
      ).rejects.toThrow(
        'Failed to fetch non-sensitive patient entries'
      );
    });
  });

  describe('getPatientById', () => {
    it('should return a patient by ID', async () => {
      const validUuid = '0ce7e630-4860-11f0-835a-299764267caf';
      const mockPatient: Patient = {
        id: validUuid,
        name: 'John Doe',
        dateOfBirth: '1980-01-01',
        gender: Gender.Male,
        occupation: 'Developer',
        entries: [],
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockPatient],
        rowCount: 1,
      } as unknown as QueryResult);

      const result = await patientService.getPatientById(validUuid);
      expect(result).toEqual(mockPatient);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM patients WHERE id = $1',
        [validUuid]
      );
    });

    it('should return null if patient not found', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      } as unknown as QueryResult);

      const result = await patientService.getPatientById('999');
      expect(result).toBeNull();
    });

    it('should throw an error when database query fails', async () => {
      const error = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValueOnce(error);
      const validUuid = uuid();

      await expect(
        patientService.getPatientById(validUuid)
      ).rejects.toThrow('Failed to find patient by ID');
    });
  });

  describe('createPatient', () => {
    it('should create a new patient', async () => {
      const newPatient: NewPatientEntryWithoutEntries = {
        name: 'John Doe',
        dateOfBirth: '1980-01-01',
        gender: Gender.Male,
        occupation: 'Developer',
      };

      const createdPatient: Patient = {
        id: '1',
        ...newPatient,
        entries: [],
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [createdPatient],
      } as unknown as QueryResult);

      const result = await patientService.createPatient(newPatient);
      expect(result).toEqual(createdPatient);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO patients (name, date_of_birth, gender, occupation) VALUES ($1, $2, $3, $4) RETURNING *',
        ['John Doe', '1980-01-01', 'male', 'Developer']
      );
    });

    it('should throw an error when database query fails', async () => {
      const error = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValueOnce(error);

      const newPatient: NewPatientEntryWithoutEntries = {
        name: 'John Doe',
        dateOfBirth: '1980-01-01',
        gender: Gender.Male,
        occupation: 'Developer',
      };

      await expect(
        patientService.createPatient(newPatient)
      ).rejects.toThrow('Failed to add patient');
    });
  });

  describe('editPatient', () => {
    it('should update an existing patient', async () => {
      const updatedPatient: NewPatientEntryWithoutEntries = {
        name: 'John Doe',
        dateOfBirth: '1980-01-01',
        gender: Gender.Male,
        occupation: 'Developer',
      };

      const patientWithId: Patient = {
        id: '1',
        ...updatedPatient,
        entries: [],
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [patientWithId],
      } as unknown as QueryResult);

      const result = await patientService.editPatient(
        '1',
        updatedPatient
      );
      expect(result).toEqual(patientWithId);
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE patients SET name = $1, date_of_birth = $2, gender = $3, occupation = $4 WHERE id = $5 RETURNING *',
        ['John Doe', '1980-01-01', 'male', 'Developer', '1']
      );
    });

    it('should return null if patient not found', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      } as unknown as QueryResult);

      const updatedPatient: NewPatientEntryWithoutEntries = {
        name: 'John Doe',
        dateOfBirth: '1980-01-01',
        gender: Gender.Male,
        occupation: 'Developer',
      };

      const result = await patientService.editPatient(
        '999',
        updatedPatient
      );
      expect(result).toBeNull();
    });

    it('should throw an error when database query fails', async () => {
      const error = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValueOnce(error);

      const updatedPatient: NewPatientEntryWithoutEntries = {
        name: 'John Doe',
        dateOfBirth: '1980-01-01',
        gender: Gender.Male,
        occupation: 'Developer',
      };

      await expect(
        patientService.editPatient('1', updatedPatient)
      ).rejects.toThrow('Failed to edit patient');
    });
  });

  describe('deletePatient', () => {
    it('should soft delete a patient and create audit record', async () => {
      const patientId = 'd2773336-f723-11e9-8f0b-362b9e155667';
      const deletedBy = 'admin-user-id';
      const reason = 'Test deletion';
      
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rowCount: 1 })   // update returns 1 row
          .mockResolvedValueOnce({}),               // INSERT audit
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValue(mockClient);

      await patientService.deletePatient(patientId, deletedBy, reason);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE patients'),
        [patientId, deletedBy]
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO patient_deletion_audit'),
        [patientId, deletedBy, reason]
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should exclude soft-deleted patients from queries', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          {
            id: 'active-patient',
            name: 'Active Patient',
            date_of_birth: '1990-01-01',
            gender: 'male',
            occupation: 'Engineer',
            health_rating: 90
          }
        ]
      });

      const result = await patientService.getNonSensitiveEntries();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('active-patient');
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE patients.is_deleted = false')
      );
    });

    it('should be idempotent for already deleted patients', async () => {
      const patientId = 'already-deleted-id';
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({})                // BEGIN transaction
          .mockResolvedValueOnce({ rowCount: 0 })   // update returns 0 rows
          .mockResolvedValueOnce({ rowCount: 1 })   // exists check returns 1 row
          .mockResolvedValueOnce({}),               // COMMIT transaction
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValue(mockClient);

      await patientService.deletePatient(patientId, 'user', 'reason');
      
      expect(mockClient.query).not.toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO patient_deletion_audit'),
        expect.anything()
      );
    });

    it('should throw NotFoundError for non-existent patient', async () => {
      const patientId = 'non-existent-id';
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({})                // BEGIN transaction
          .mockResolvedValueOnce({ rowCount: 0 })   // update returns 0 rows
          .mockResolvedValueOnce({ rowCount: 0 })   // exists check returns 0 rows
          .mockResolvedValueOnce({}),               // ROLLBACK transaction
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValue(mockClient);

      await expect(
        patientService.deletePatient(patientId, 'user', 'reason')
      ).rejects.toThrow(NotFoundError);
    });

    it('should handle database errors during deletion', async () => {
      const error = new Error('Database failure');
      const mockClient = {
        query: jest.fn()
          .mockRejectedValueOnce(error),
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValue(mockClient);

      await expect(
        patientService.deletePatient('1', 'user', 'reason')
      ).rejects.toThrow('Failed to soft delete patient');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('parameter binding consistency', () => {
    it('should use parameterized queries for all database operations', () => {
      patientService.getNonSensitiveEntries();
      const queryArgs = (pool.query as jest.Mock).mock.calls[0];
      expect(queryArgs[1]).toBeInstanceOf(Array);
      expect(queryArgs[1].length).toBeGreaterThan(0);

      patientService.getPatientById('1');
      const queryArgs2 = (pool.query as jest.Mock).mock.calls[0];
      expect(queryArgs2[1]).toBeInstanceOf(Array);
      expect(queryArgs2[1].length).toBeGreaterThan(0);

      const newPatient: NewPatientEntryWithoutEntries = {
        name: 'John Doe',
        dateOfBirth: '1980-01-01',
        gender: Gender.Male,
        occupation: 'Developer',
      };
      patientService.createPatient(newPatient);
      const queryArgs3 = (pool.query as jest.Mock).mock.calls[0];
      expect(queryArgs3[1]).toBeInstanceOf(Array);
      expect(queryArgs3[1].length).toBeGreaterThan(0);

      patientService.editPatient('1', newPatient);
      const queryArgs4 = (pool.query as jest.Mock).mock.calls[0];
      expect(queryArgs4[1]).toBeInstanceOf(Array);
      expect(queryArgs4[1].length).toBeGreaterThan(0);

      patientService.deletePatient('1', 'test-user', 'test reason');
      const queryArgs5 = (pool.query as jest.Mock).mock.calls[0];
      expect(queryArgs5[1]).toBeInstanceOf(Array);
      expect(queryArgs5[1].length).toBeGreaterThan(0);
    });

    it('should prevent SQL injection through parameter binding', async () => {
      const dangerousInput = "'; DROP TABLE patients; --";
      const newPatient: NewPatientEntryWithoutEntries = {
        name: dangerousInput,
        dateOfBirth: '1980-01-01',
        gender: Gender.Male,
        occupation: 'Developer',
      };

      await expect(
        patientService.createPatient(newPatient)
      ).resolves.not.toThrow();

      const queryArgs = (pool.query as jest.Mock).mock.calls[0];
      expect(queryArgs[1]).toEqual([
        dangerousInput,
        '1980-01-01',
        'male',
        'Developer',
      ]);
    });

    it('should handle special characters in parameters correctly', async () => {
      const specialChars = "O'Reilly & Sons";
      const newPatient: NewPatientEntryWithoutEntries = {
        name: specialChars,
        dateOfBirth: '1980-01-01',
        gender: Gender.Male,
        occupation: 'Developer',
      };

      await expect(
        patientService.createPatient(newPatient)
      ).resolves.not.toThrow();

      const queryArgs = (pool.query as jest.Mock).mock.calls[0];
      expect(queryArgs[1]).toEqual([
        specialChars,
        '1980-01-01',
        'male',
        'Developer',
      ]);
    });

    it('should maintain parameter order consistency', async () => {
      const newPatient: NewPatientEntryWithoutEntries = {
        name: 'John Doe',
        dateOfBirth: '1980-01-01',
        gender: Gender.Male,
        occupation: 'Developer',
      };

      await patientService.createPatient(newPatient);

      const queryArgs = (pool.query as jest.Mock).mock.calls[0];
      expect(queryArgs[1][0]).toBe('John Doe');
      expect(queryArgs[1][1]).toBe('1980-01-01');
      expect(queryArgs[1][2]).toBe('male');
      expect(queryArgs[1][3]).toBe('Developer');
    });

    it('should handle null values in parameters', async () => {
      const newPatient: NewPatientEntryWithoutEntries = {
        name: 'John Doe',
        dateOfBirth: null as any, // TypeScript will complain about this, but we want to test null handling
        gender: Gender.Male,
        occupation: 'Developer',
      };

      await expect(
        patientService.createPatient(newPatient)
      ).resolves.not.toThrow();

      const queryArgs = (pool.query as jest.Mock).mock.calls[0];
      expect(queryArgs[1]).toEqual([
        'John Doe',
        null,
        'male',
        'Developer',
      ]);
    });

    describe('getFilteredAndPaginatedPatients', () => {
      it('should return paginated results with default sorting', async () => {
        const mockPatients: NonSensitivePatientEntry[] = Array.from(
          { length: 10 },
          (_, i) => ({
            id: i.toString(),
            name: `Patient ${i}`,
            dateOfBirth: '1980-01-01',
            gender: i % 2 === 0 ? Gender.Male : Gender.Female,
            occupation: 'Developer',
            healthRating: 85,
          })
        );

        (pool.query as jest.Mock).mockResolvedValueOnce({
          rows: mockPatients.map((p) => ({
            id: p.id,
            name: p.name,
            date_of_birth: p.dateOfBirth,
            gender: p.gender.toLowerCase(),
            occupation: p.occupation,
            health_rating: p.healthRating,
          })),
        } as unknown as QueryResult);

        const result =
          await patientService.getFilteredAndPaginatedPatients(
            1,
            10,
            {}
          );

        expect(result.data).toHaveLength(10);
        expect(result.metadata.totalItems).toBe(10);
        expect(result.metadata.currentPage).toBe(1);
        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining('ORDER BY name ASC')
        );
      });

      it('should sort results by health rating in descending order', async () => {
        const mockPatients: NonSensitivePatientEntry[] = [
          {
            id: '1',
            name: 'Patient 1',
            dateOfBirth: '1980-01-01',
            gender: Gender.Male,
            occupation: 'Developer',
            healthRating: 90,
          },
          {
            id: '2',
            name: 'Patient 2',
            dateOfBirth: '1980-01-01',
            gender: Gender.Female,
            occupation: 'Designer',
            healthRating: 80,
          },
          {
            id: '3',
            name: 'Patient 3',
            dateOfBirth: '1980-01-01',
            gender: Gender.Male,
            occupation: 'Engineer',
            healthRating: 85,
          },
        ];

        (pool.query as jest.Mock).mockResolvedValueOnce({
          rows: mockPatients.map((p) => ({
            id: p.id,
            name: p.name,
            date_of_birth: p.dateOfBirth,
            gender: p.gender.toLowerCase(),
            occupation: p.occupation,
            health_rating: p.healthRating,
          })),
        } as unknown as QueryResult);

        const result =
          await patientService.getFilteredAndPaginatedPatients(
            1,
            10,
            {},
            { field: 'health_rating', direction: 'DESC' }
          );

        expect(result.data).toHaveLength(3);
        expect(result.data[0].healthRating).toBe(90);
        expect(result.data[1].healthRating).toBe(85);
        expect(result.data[2].healthRating).toBe(80);
        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining('ORDER BY health_rating DESC')
        );
      });

      it('should sort results by name in ascending order', async () => {
        const mockPatients: NonSensitivePatientEntry[] = [
          {
            id: '1',
            name: 'Charlie',
            dateOfBirth: '1980-01-01',
            gender: Gender.Male,
            occupation: 'Developer',
            healthRating: 85,
          },
          {
            id: '2',
            name: 'Alice',
            dateOfBirth: '1980-01-01',
            gender: Gender.Female,
            occupation: 'Designer',
            healthRating: 90,
          },
          {
            id: '3',
            name: 'Bob',
            dateOfBirth: '1980-01-01',
            gender: Gender.Male,
            occupation: 'Engineer',
            healthRating: 80,
          },
        ];

        (pool.query as jest.Mock).mockResolvedValueOnce({
          rows: mockPatients.map((p) => ({
            id: p.id,
            name: p.name,
            date_of_birth: p.dateOfBirth,
            gender: p.gender.toLowerCase(),
            occupation: p.occupation,
            health_rating: p.healthRating,
          })),
        } as unknown as QueryResult);

        const result =
          await patientService.getFilteredAndPaginatedPatients(
            1,
            10,
            {},
            { field: 'name', direction: 'ASC' }
          );

        expect(result.data).toHaveLength(3);
        expect(result.data[0].name).toBe('Alice');
        expect(result.data[1].name).toBe('Bob');
        expect(result.data[2].name).toBe('Charlie');
        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining('ORDER BY name ASC')
        );
      });

      it('should handle invalid sort field gracefully', async () => {
        const mockPatients: NonSensitivePatientEntry[] = Array.from(
          { length: 10 },
          (_, i) => ({
            id: i.toString(),
            name: `Patient ${i}`,
            dateOfBirth: '1980-01-01',
            gender: i % 2 === 0 ? Gender.Male : Gender.Female,
            occupation: 'Developer',
            healthRating: 85,
          })
        );

        (pool.query as jest.Mock).mockResolvedValueOnce({
          rows: mockPatients.map((p) => ({
            id: p.id,
            name: p.name,
            date_of_birth: p.dateOfBirth,
            gender: p.gender.toLowerCase(),
            occupation: p.occupation,
            health_rating: p.healthRating,
          })),
        } as unknown as QueryResult);

        const result =
          await patientService.getFilteredAndPaginatedPatients(
            1,
            10,
            {},
            { field: 'invalid_field', direction: 'ASC' }
          );

        expect(result.data).toHaveLength(10);
        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining('ORDER BY name ASC')
        );
      });
    });
  });

  describe('parameter binding and health rating tests', () => {
    it('should maintain consistent parameter count between main and count queries', async () => {
      const filters = { gender: 'male', minHealthRating: 80 };
      const sort = { field: 'health_rating', direction: 'DESC' };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          {
            id: '1',
            name: 'John Doe',
            date_of_birth: '1980-01-01',
            gender: 'male',
            occupation: 'Developer',
            health_rating: 85,
          },
        ],
        rowCount: 1,
      });

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ count: 1 }],
      });

      await patientService.getFilteredAndPaginatedPatients(
        1,
        10,
        filters,
        sort
      );

      const mainQueryParams = (pool.query as jest.Mock).mock
        .calls[0][1];
      const countQueryParams = (pool.query as jest.Mock).mock
        .calls[1][1];

      expect(mainQueryParams).toEqual(countQueryParams);
    });

    it('should handle null health ratings in sorting', async () => {
      const mockPatients = [
        {
          id: '1',
          name: 'John Doe',
          date_of_birth: '1980-01-01',
          gender: 'male',
          occupation: 'Developer',
          health_rating: 90,
        },
        {
          id: '2',
          name: 'Jane Smith',
          date_of_birth: '1990-01-01',
          gender: 'female',
          occupation: 'Designer',
          health_rating: 85,
        },
        {
          id: '3',
          name: 'Bob Johnson',
          date_of_birth: '1975-05-15',
          gender: 'male',
          occupation: 'Manager',
          health_rating: null,
        },
      ];

      (pool.query as jest.Mock).mockResolvedValue({
        rows: mockPatients,
      });

      const result =
        await patientService.getFilteredAndPaginatedPatients(
          1,
          10,
          {},
          { field: 'health_rating', direction: 'DESC' }
        );

      expect(result.data[0].healthRating).toBe(90);
      expect(result.data[1].healthRating).toBe(85);
      expect(result.data[2].healthRating).toBeNull();
    });
  });

  describe('regression tests', () => {
    it('should handle 08P01 protocol violation gracefully', async () => {
      const error = new Error(
        'canceling statement due to user request'
      );
      (error as any).code = '08P01';

      (pool.query as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        patientService.getNonSensitiveEntries()
      ).rejects.toThrow('08P01');
    });
  });
});
