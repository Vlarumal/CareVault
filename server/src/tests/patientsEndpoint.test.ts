import axios, { AxiosError }from 'axios';
import { clearDatabase, createTestPatientWithEntries, seedDatabase } from './testUtils';
import pool from '../../db/connection';
import formatToISODate from '../../src/utils/dateFormatter';
import { Gender, NewEntryWithoutId } from '../../src/types';
import { v1 as uuid } from 'uuid';
import dotenv from 'dotenv';

dotenv.config()

const baseUrl = process.env.BASE_URL;

describe('Patients API Endpoint', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('GET /api/patients', () => {
    beforeEach(async () => {
      await seedDatabase();
    });

    test('should return 200 status with patient data', async () => {
      const response = await axios.get(
        `${baseUrl}/api/patients`
      );
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(typeof response.data === 'object').toBe(true);
      expect(response.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
      expect(response.data.data[0]).toHaveProperty('id');
      expect(response.data.data[0]).toHaveProperty('name');
      expect(response.data.data[0]).toHaveProperty('dateOfBirth');
      expect(response.data.data[0]).toHaveProperty('gender');
      expect(response.data.data[0]).toHaveProperty('occupation');
    });
  });

  describe('GET /api/patients/:id', () => {
    let patientId: string;

    beforeEach(async () => {
      const patient = await createTestPatientWithEntries(
        {
          name: 'Test Patient',
          dateOfBirth: '1990-01-01',
          gender: Gender.Male,
          occupation: 'Engineer'
        },
        [
          {
            description: 'Annual physical',
            date: '2023-05-15',
            specialist: 'Dr. Smith',
            type: 'HealthCheck',
            healthCheckRating: 0
          },
          {
            description: 'Emergency visit',
            date: '2023-06-01',
            specialist: 'Dr. Johnson',
            type: 'Hospital',
            discharge: {
              date: '2023-06-03',
              criteria: 'Stable condition'
            }
          }
        ]
      );
      patientId = patient.id;
    });

    test('should return patient details with entries including full structure', async () => {

      const response = await axios.get(
        `${baseUrl}/api/patients/${patientId}`
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();

      // Verify basic patient details
      expect(response.data).toHaveProperty('id', patientId);
      expect(response.data).toHaveProperty('name', 'Test Patient');
      expect(['1990-01-01', '1990-01-01T00:00:00.000Z']).toContain(
        response.data.date_of_birth
      );
      expect(response.data).toHaveProperty('gender', 'male');
      expect(response.data).toHaveProperty('occupation', 'Engineer');

      expect(response.data).toHaveProperty('entries');
      const entries = response.data.entries;
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(2);

      const firstEntry = entries[0];
      expect(firstEntry).toHaveProperty('id');
      expect(firstEntry).toHaveProperty('description');
      expect(firstEntry).toHaveProperty('date');
      expect(firstEntry).toHaveProperty('specialist');
      expect(firstEntry).toHaveProperty('type');

      if (firstEntry.type === 'HealthCheck') {
        expect(firstEntry).toHaveProperty('healthCheckRating');
      } else if (firstEntry.type === 'Hospital') {
        expect(firstEntry).toHaveProperty('discharge');
        expect(firstEntry.discharge).toHaveProperty('date');
        expect(firstEntry.discharge).toHaveProperty('criteria');
      } else if (firstEntry.type === 'OccupationalHealthcare') {
        expect(firstEntry).toHaveProperty('employerName');
      }
    });

    test('should handle invalid patient ID', async () => {
      try {
        await axios.get(
          `${baseUrl}/api/patients/00000000-0000-0000-0000-000000000000`
        );
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
        expect(error.response?.data).toHaveProperty('error');
      }
    });
  });

  describe('POST /api/patients', () => {
    test('should create a new patient with empty entries array and return 201', async () => {
      const newPatient = {
        name: 'John Doe',
        dateOfBirth: '1985-05-15',
        gender: 'male',
        occupation: 'Software Engineer',
      };

      const response = await axios.post(
        `${baseUrl}/api/patients`,
        newPatient
      );
      expect(response.status).toBe(201);
      expect(response.data).toBeDefined();
      expect(response.data).toHaveProperty('id');
      expect(response.data.name).toBe(newPatient.name);
      expect(formatToISODate(response.data.date_of_birth)).toBe(
        newPatient.dateOfBirth
      );
      expect(response.data.gender).toBe(newPatient.gender);
      expect(response.data.occupation).toBe(newPatient.occupation);

      expect(response.data).toHaveProperty('entries');
      expect(Array.isArray(response.data.entries)).toBe(true);
      expect(response.data.entries).toHaveLength(0);
    });

    test('should return 400 for invalid patient data', async () => {
      const invalidPatient = {
        name: '', 
        dateOfBirth: 'invalid-date',
        gender: 'unknown',
        occupation: '',
      };

      try {
        await axios.post(
          `${baseUrl}/api/patients`,
          invalidPatient
        );
        fail('Should have thrown error');
      } catch (error) {
        const errorResponse = error as any;
        expect(errorResponse.response?.status).toBe(400);
        expect(errorResponse.response?.data).toHaveProperty('error');
      }
    });
  });

  describe('PUT /api/patients/:id', () => {
    let patientId: string;
    const updatedData = {
      name: 'Updated Name',
      occupation: 'Updated Occupation',
    };

    beforeEach(async () => {
      const newPatient = {
        name: 'Original Name',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        occupation: 'Original Occupation',
      };
      const response = await axios.post(
        `${baseUrl}/api/patients`,
        newPatient
      );
      patientId = response.data.id;
    });

    test('should update patient and return 200', async () => {
      const response = await axios.put(
        `${baseUrl}/api/patients/${patientId}`,
        updatedData
      );
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.name).toBe(updatedData.name);
      expect(response.data.occupation).toBe(updatedData.occupation);
    });

    test('should return 400 for invalid update data', async () => {
      const invalidData = {
        dateOfBirth: 'invalid-date',
      };

      try {
        await axios.put(
          `${baseUrl}/api/patients/${patientId}`,
          invalidData
        );
        fail('Should have thrown error');
      } catch (error) {
        const errorResponse = error as AxiosError;
        expect(errorResponse.response?.status).toBe(400);
        expect(errorResponse.response?.data).toHaveProperty('error');
      }
    });

    test('should return 404 for non-existent patient', async () => {
      const nonExistentId = uuid();
      try {
        await axios.put(
          `${baseUrl}/api/patients/${nonExistentId}`,
          updatedData
        );
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
      }
    });
  });

  describe('POST /api/patients/:id/entries', () => {
    let patientId: string;

    beforeEach(async () => {
      const newPatient = {
        name: 'Test Patient',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        occupation: 'Engineer',
      };
      const createResponse = await axios.post(
        `${baseUrl}/api/patients`,
        newPatient
      );
      patientId = createResponse.data.id;
    });

    test('should add HealthCheck entry to patient', async () => {
      const newEntry = {
        description: 'Annual checkup',
        date: '2023-05-15',
        specialist: 'Dr. Smith',
        type: 'HealthCheck',
        healthCheckRating: 0,
      };

      const response = await axios.post(
        `${baseUrl}/api/patients/${patientId}/entries`,
        newEntry
      );
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.description).toBe(newEntry.description);
      expect(response.data.type).toBe('HealthCheck');
    });

    test('should add Hospital entry to patient', async () => {
      const newEntry = {
        description: 'Emergency visit',
        date: '2023-06-01',
        specialist: 'Dr. Johnson',
        type: 'Hospital',
        discharge: {
          date: '2023-06-03',
          criteria: 'Stable condition',
        },
      };

      const response = await axios.post(
        `${baseUrl}/api/patients/${patientId}/entries`,
        newEntry
      );
      expect(response.status).toBe(201);
      expect(response.data.type).toBe('Hospital');
      expect(response.data.discharge.criteria).toBe(
        'Stable condition'
      );
    });

    test('should add OccupationalHealthcare entry to patient', async () => {
      const newEntry = {
        description: 'Work injury',
        date: '2023-04-20',
        specialist: 'Dr. Williams',
        type: 'OccupationalHealthcare',
        employerName: 'Acme Corp',
        sickLeave: {
          startDate: '2023-04-20',
          endDate: '2023-04-27',
        },
      };

      const response = await axios.post(
        `${baseUrl}/api/patients/${patientId}/entries`,
        newEntry
      );
      expect(response.status).toBe(201);
      expect(response.data.type).toBe('OccupationalHealthcare');
      expect(response.data.employerName).toBe('Acme Corp');
    });

    test('should return 400 for invalid entry data', async () => {
      const invalidEntry = {
        description: '',
        date: '2023-01-01',
        specialist: 'Dr. Invalid',
        type: 'HealthCheck',
        healthCheckRating: 5,
      };

      try {
        await axios.post(
          `${baseUrl}/api/patients/${patientId}/entries`,
          invalidEntry
        );
        fail('Should have thrown validation error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(400);
        expect(axiosError.response?.data).toHaveProperty('error');
      }
    });

    test('should return 404 for non-existent patient', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const validEntry = {
        description: 'Valid entry',
        date: '2023-01-01',
        specialist: 'Dr. Valid',
        type: 'HealthCheck',
        healthCheckRating: 0,
      };

      try {
        await axios.post(
          `${baseUrl}/api/patients/${nonExistentId}/entries`,
          validEntry
        );
        fail('Should have thrown not found error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(404);
      }
    });
  });
  describe('PUT /api/patients/:patientId/entries/:entryId', () => {
    let patientId: string;
    let entryId: string;

    beforeEach(async () => {
      const newPatient = {
        name: 'Test Patient for Entry Update',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        occupation: 'Engineer',
      };
      const createPatientResponse = await axios.post(
        `${baseUrl}/api/patients`,
        newPatient
      );
      patientId = createPatientResponse.data.id;

      const newEntry = {
        description: 'Initial description',
        date: '2023-01-01',
        specialist: 'Dr. Initial',
        type: 'HealthCheck',
        healthCheckRating: 0,
      };
      const createEntryResponse = await axios.post(
        `${baseUrl}/api/patients/${patientId}/entries`,
        newEntry
      );
      entryId = createEntryResponse.data.id;
    });

    test('should update an existing entry and return 200', async () => {
      const updatedEntry = {
        description: 'Updated description',
        date: '2023-01-02',
        specialist: 'Dr. Updated',
        type: 'HealthCheck',
        healthCheckRating: 1,
      };

      const response = await axios.put(
        `${baseUrl}/api/patients/${patientId}/entries/${entryId}`,
        updatedEntry
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject(updatedEntry);
    });

    test('should return 400 for invalid update data', async () => {
      const invalidEntry = {
        description: '',
        date: '2023-01-02',
        specialist: 'Dr. Updated',
        healthCheckRating: 5,
      };

      try {
        await axios.put(
          `${baseUrl}/api/patients/${patientId}/entries/${entryId}`,
          invalidEntry
        );
        fail('Should have thrown error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(400);
        expect(axiosError.response?.data).toHaveProperty('error');
      }
    });

    test('should return 404 for non-existent entry', async () => {
      const nonExistentEntryId =
        '00000000-0000-0000-0000-000000000000';
      const validUpdate = {
        description: 'Updated description',
        date: '2023-01-02',
        specialist: 'Dr. Updated',
        type: 'HealthCheck',
        healthCheckRating: 1,
      };

      try {
        await axios.put(
          `${baseUrl}/api/patients/${patientId}/entries/${nonExistentEntryId}`,
          validUpdate
        );
        fail('Should have thrown error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(404);
      }
    });

    test.skip('should handle concurrent updates with optimistic locking', async () => {
      const firstUpdate = {
        description: 'First update',
        date: '2023-01-02',
        specialist: 'Dr. First',
        healthCheckRating: 1,
      };
      await axios.put(
        `${baseUrl}/api/patients/${patientId}/entries/${entryId}`,
        firstUpdate
      );

      // Second update with outdated data
      const secondUpdate = {
        description: 'Second update',
        date: '2023-01-03',
        specialist: 'Dr. Second',
        healthCheckRating: 2,
      };

      try {
        await axios.put(
          `${baseUrl}/api/patients/${patientId}/entries/${entryId}`,
          secondUpdate
        );
        fail('Should have thrown conflict error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(409);
      }
    });

    test('should validate entry type-specific fields during update', async () => {
      const invalidHospitalEntry = {
        description: 'Invalid hospital entry',
        date: '2023-01-02',
        specialist: 'Dr. Invalid',
        type: 'Hospital',
        discharge: {
          date: 'invalid-date',
          criteria: '',
        },
      };

      try {
        await axios.put(
          `${baseUrl}/api/patients/${patientId}/entries/${entryId}`,
          invalidHospitalEntry
        );
        fail('Should have thrown validation error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(400);
        expect(axiosError.response?.data).toHaveProperty('error');
      }
    });
  });

  describe('DELETE /api/patients/:id', () => {

    test('should delete a patient and return 204', async () => {
      // Create a new patient just for this test
      const tempPatient = await createTestPatientWithEntries(
        {
          name: 'Temp Patient',
          dateOfBirth: '1990-01-01',
          gender: Gender.Male,
          occupation: 'Temp Worker'
        },
        []
      );
      
      const deleteResponse = await axios.delete(
        `${baseUrl}/api/patients/${tempPatient.id}`
      );
      expect(deleteResponse.status).toBe(204);

      try {
        await axios.get(
          `${baseUrl}/api/patients/${tempPatient.id}`
        );
        fail('Patient should not exist');
      } catch (error) {
        const errorResponse = error as AxiosError;
        expect(errorResponse.response?.status).toBe(404);
      }
    });

    test('should return 404 when deleting non-existent patient', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'; // valid UUID format but non-existent
      try {
        await axios.delete(
          `${baseUrl}/api/patients/${nonExistentId}`
        );
        fail('Should have thrown error');
      } catch (error) {
        const errorResponse = error as AxiosError;
        expect(errorResponse.response?.status).toBe(404);
        if (errorResponse.response) {
          const responseData = errorResponse.response.data as {
            error: string;
          };
          expect(responseData).toHaveProperty('error');
          expect(responseData.error).toContain('Patient');
        }
      }
    });
  });

  describe('DELETE /api/patients/:patientId/entries/:entryId', () => {
    let patientId: string;
    let entryId: string;

    beforeEach(async () => {
      const entry: NewEntryWithoutId = {
        description: 'Test entry',
        date: '2020-01-01',
        specialist: 'Dr. Test',
        type: 'HealthCheck',
        healthCheckRating: 0
      } as const;
      
      const patient = await createTestPatientWithEntries(
        {
          name: 'Test Patient',
          dateOfBirth: '1990-01-01',
          gender: Gender.Male,
          occupation: 'Engineer'
        },
        [entry]
      );
      
      patientId = patient.id;
      entryId = patient.entries[0].id;
    });

    test('should delete an entry and return 204', async () => {
      // Create a new patient with an entry just for this test
      const tempPatient = await createTestPatientWithEntries(
        {
          name: 'Temp Patient',
          dateOfBirth: '1990-01-01',
          gender: Gender.Male,
          occupation: 'Temp Worker'
        },
        [
          {
            description: 'Temp entry',
            date: '2023-01-01',
            specialist: 'Dr. Temp',
            type: 'HealthCheck',
            healthCheckRating: 0
          }
        ]
      );
      const tempEntryId = tempPatient.entries[0].id;
      
      const response = await axios.delete(
        `${baseUrl}/api/patients/${tempPatient.id}/entries/${tempEntryId}`
      );
      expect(response.status).toBe(204);

      try {
        await axios.get(
          `${baseUrl}/api/patients/${tempPatient.id}/entries/${tempEntryId}`
        );
        fail('Entry should not exist');
      } catch (error) {
        const errorResponse = error as AxiosError;
        expect(errorResponse.response?.status).toBe(404);
      }
    });

    test('should return 404 for non-existent entry', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      try {
        await axios.delete(
          `${baseUrl}/api/patients/${patientId}/entries/${nonExistentId}`
        );
        fail('Should have thrown error');
      } catch (error) {
        const errorResponse = error as AxiosError;
        expect(errorResponse.response?.status).toBe(404);
      }
    });

    test('should return 404 for non-existent patient', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      try {
        await axios.delete(
          `${baseUrl}/api/patients/${nonExistentId}/entries/${entryId}`
        );
        fail('Should have thrown error');
      } catch (error) {
        const errorResponse = error as AxiosError;
        expect(errorResponse.response?.status).toBe(404);
      }
    });
  });
  test('should handle database connection issues', async () => {
    await pool.end();
    try {
      await axios.get(`${baseUrl}/api/patients`);
    } catch (error) {
      const errorResponse = error as AxiosError;
      expect(errorResponse.response?.status).toBe(500);
      expect(errorResponse.response?.data).toHaveProperty('error');
    } finally {
      pool.connect = async () => {
        const newPool = require('../../db/connection');
        return newPool.connect();
      };
    }
  });
});
