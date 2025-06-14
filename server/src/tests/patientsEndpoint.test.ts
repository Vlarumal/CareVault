import request from 'supertest';
import app from '../index';
import { patientService } from '../services/patientsService';
import { clearDatabase, seedDatabase } from './testUtils';
import {
  NonSensitivePatientEntry,
  Gender,
  PaginatedResponse,
  Patient,
} from '../types';

jest.mock('../services/patientsService');

describe('Patients Endpoint', () => {
  beforeAll(async () => {
    await clearDatabase();
    await seedDatabase();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/patients', () => {
    it('should return a list of patients', async () => {
      const mockPatients: NonSensitivePatientEntry[] = [
        { id: '1', name: 'John Doe', dateOfBirth: '1980-01-01', gender: Gender.Male, occupation: 'Developer', healthRating: 85 },
        { id: '2', name: 'Jane Smith', dateOfBirth: '1990-01-01', gender: Gender.Female, occupation: 'Designer', healthRating: 90 },
      ];

      const paginatedResponse: PaginatedResponse<NonSensitivePatientEntry[]> = {
        data: mockPatients,
        metadata: {
          totalItems: mockPatients.length,
          totalPages: 1,
          currentPage: 1,
          itemsPerPage: 10,
        },
      };

      (patientService.getFilteredAndPaginatedPatients as jest.Mock).mockResolvedValue(
        paginatedResponse,
      );

      const response = await request(app)
        .get('/api/patients')
        .query({ page: 1, pageSize: 10 });
        
      expect(response.status).toBe(200);
      expect(response.body).toEqual(paginatedResponse);
    });

    it('should handle empty result set', async () => {
      const paginatedResponse: PaginatedResponse<NonSensitivePatientEntry[]> = {
        data: [],
        metadata: {
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          itemsPerPage: 10,
        },
      };

      (patientService.getFilteredAndPaginatedPatients as jest.Mock).mockResolvedValue(
        paginatedResponse,
      );

      const response = await request(app)
        .get('/api/patients')
        .query({ page: 1, pageSize: 10 });
        
      expect(response.status).toBe(200);
      expect(response.body).toEqual(paginatedResponse);
    });

    it('should handle database error', async () => {
      const error = new Error('Database error');
      (patientService.getFilteredAndPaginatedPatients as jest.Mock).mockRejectedValue(
        error,
      );

      const response = await request(app)
        .get('/api/patients')
        .query({ page: 1, pageSize: 10 });
        
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Database error' });
    });

    it('should support pagination', async () => {
      const mockPatients: NonSensitivePatientEntry[] = [
        { id: '1', name: 'John Doe', dateOfBirth: '1980-01-01', gender: Gender.Male, occupation: 'Developer', healthRating: 85 },
        { id: '2', name: 'Jane Smith', dateOfBirth: '1990-01-01', gender: Gender.Female, occupation: 'Designer', healthRating: 90 },
        { id: '3', name: 'Bob Johnson', dateOfBirth: '1975-05-15', gender: Gender.Male, occupation: 'Manager', healthRating: 75 },
      ];

      const paginatedResponse: PaginatedResponse<NonSensitivePatientEntry[]> = {
        data: mockPatients.slice(0, 2),
        metadata: {
          totalItems: mockPatients.length,
          totalPages: 2,
          currentPage: 1,
          itemsPerPage: 2,
        },
      };

      (patientService.getNonSensitiveEntries as jest.Mock).mockResolvedValue(
        paginatedResponse,
      );

      const response = await request(app)
        .get('/api/patients')
        .query({ page: 1, pageSize: 2 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(paginatedResponse);
    });

    it('should support filtering', async () => {
      const mockPatients: NonSensitivePatientEntry[] = [
        { id: '1', name: 'John Doe', dateOfBirth: '1980-01-01', gender: Gender.Male, occupation: 'Developer', healthRating: 85 },
        { id: '2', name: 'Jane Smith', dateOfBirth: '1990-01-01', gender: Gender.Female, occupation: 'Designer', healthRating: 90 },
      ];

      (patientService.getNonSensitiveEntries as jest.Mock).mockResolvedValue(
        mockPatients,
      );

      const response = await request(app)
        .get('/api/patients')
        .query({ gender: 'male' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPatients);
    });

    it('should support sorting', async () => {
      const mockPatients: NonSensitivePatientEntry[] = [
        { id: '1', name: 'John Doe', dateOfBirth: '1980-01-01', gender: Gender.Male, occupation: 'Developer', healthRating: 85 },
        { id: '2', name: 'Jane Smith', dateOfBirth: '1990-01-01', gender: Gender.Female, occupation: 'Designer', healthRating: 90 },
      ];

      (patientService.getNonSensitiveEntries as jest.Mock).mockResolvedValue(
        mockPatients,
      );

      const response = await request(app)
        .get('/api/patients')
        .query({ sortBy: 'name', sortOrder: 'asc' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPatients);
    });

    it('should support health rating integration', async () => {
      const mockPatients: NonSensitivePatientEntry[] = [
        { id: '1', name: 'John Doe', dateOfBirth: '1980-01-01', gender: Gender.Male, occupation: 'Developer', healthRating: 85 },
        { id: '2', name: 'Jane Smith', dateOfBirth: '1990-01-01', gender: Gender.Female, occupation: 'Designer', healthRating: 90 },
      ];

      (patientService.getNonSensitiveEntries as jest.Mock).mockResolvedValue(
        mockPatients,
      );

      const response = await request(app)
        .get('/api/patients')
        .query({ minHealthRating: 80 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPatients);
    });

    it('should handle invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/patients')
        .query({ invalidParam: 'value' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid query parameters' });
    });

    it('should handle missing required parameters', async () => {
      const response = await request(app)
        .get('/api/patients')
        .query({ page: 'abc' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid query parameters' });
    });

    it('should handle parameter count mismatches', async () => {
      const response = await request(app)
        .get('/api/patients')
        .query({ page: 1, pageSize: 'abc' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid query parameters' });
    });

    it('should handle sorting by health rating', async () => {
      const mockPatients: NonSensitivePatientEntry[] = [
        { id: '2', name: 'Jane Smith', dateOfBirth: '1990-01-01', gender: Gender.Female, occupation: 'Designer', healthRating: 90 },
        { id: '1', name: 'John Doe', dateOfBirth: '1980-01-01', gender: Gender.Male, occupation: 'Developer', healthRating: 85 },
      ];

      (patientService.getFilteredAndPaginatedPatients as jest.Mock).mockResolvedValue({
        data: mockPatients,
        metadata: {
          totalItems: 2,
          totalPages: 1,
          currentPage: 1,
          itemsPerPage: 10,
        },
      });

      const response = await request(app)
        .get('/api/patients')
        .query({ sortBy: 'healthRating', sortOrder: 'desc' });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockPatients);
    });

    it('should handle complex query parameter parsing', async () => {
      const mockPatients: NonSensitivePatientEntry[] = [
        { id: '1', name: 'John Doe', dateOfBirth: '1980-01-01', gender: Gender.Male, occupation: 'Developer', healthRating: 85 },
      ];

      (patientService.getFilteredAndPaginatedPatients as jest.Mock).mockResolvedValue({
        data: mockPatients,
        metadata: {
          totalItems: 1,
          totalPages: 1,
          currentPage: 1,
          itemsPerPage: 10,
        },
      });

      const response = await request(app)
        .get('/api/patients')
        .query({
          page: 1,
          pageSize: 10,
          gender: 'male',
          minHealthRating: 80,
          sortBy: 'healthRating',
          sortOrder: 'desc',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockPatients);
    });

    it('should handle health rating integration with filtering', async () => {
      const mockPatients: NonSensitivePatientEntry[] = [
        { id: '1', name: 'John Doe', dateOfBirth: '1980-01-01', gender: Gender.Male, occupation: 'Developer', healthRating: 85 },
      ];

      (patientService.getFilteredAndPaginatedPatients as jest.Mock).mockResolvedValue({
        data: mockPatients,
        metadata: {
          totalItems: 1,
          totalPages: 1,
          currentPage: 1,
          itemsPerPage: 10,
        },
      });

      const response = await request(app)
        .get('/api/patients')
        .query({
          minHealthRating: 80,
          gender: 'male',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockPatients);
    });

    it('should handle health rating integration with sorting and pagination', async () => {
      const mockPatients: NonSensitivePatientEntry[] = [
        { id: '1', name: 'John Doe', dateOfBirth: '1980-01-01', gender: Gender.Male, occupation: 'Developer', healthRating: 85 },
        { id: '2', name: 'Jane Smith', dateOfBirth: '1990-01-01', gender: Gender.Female, occupation: 'Designer', healthRating: 90 },
      ];

      (patientService.getFilteredAndPaginatedPatients as jest.Mock).mockResolvedValue({
        data: mockPatients,
        metadata: {
          totalItems: 2,
          totalPages: 1,
          currentPage: 1,
          itemsPerPage: 10,
        },
      });

      const response = await request(app)
        .get('/api/patients')
        .query({
          page: 1,
          pageSize: 10,
          sortBy: 'healthRating',
          sortOrder: 'desc',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockPatients);
    });

    it('should filter by exact date match', async () => {
      const mockPatients: NonSensitivePatientEntry[] = [
        { id: '1', name: 'John Doe', dateOfBirth: '1980-01-01', gender: Gender.Male, occupation: 'Developer', healthRating: 85 },
      ];

      (patientService.getNonSensitiveEntries as jest.Mock).mockResolvedValue(
        mockPatients,
      );

      const response = await request(app)
        .get('/api/patients')
        .query({ dateOfBirth: '1980-01-01' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPatients);
    });

    it('should filter by date greater than', async () => {
      const mockPatients: NonSensitivePatientEntry[] = [
        { id: '2', name: 'Jane Smith', dateOfBirth: '1990-01-01', gender: Gender.Female, occupation: 'Designer', healthRating: 90 },
      ];

      (patientService.getNonSensitiveEntries as jest.Mock).mockResolvedValue(
        mockPatients,
      );

      const response = await request(app)
        .get('/api/patients')
        .query({ dateOfBirth: { '>': '1985-01-01' } });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPatients);
    });

    it('should filter by date less than', async () => {
      const mockPatients: NonSensitivePatientEntry[] = [
        { id: '1', name: 'John Doe', dateOfBirth: '1980-01-01', gender: Gender.Male, occupation: 'Developer', healthRating: 85 },
      ];

      (patientService.getNonSensitiveEntries as jest.Mock).mockResolvedValue(
        mockPatients,
      );

      const response = await request(app)
        .get('/api/patients')
        .query({ dateOfBirth: { '<': '1985-01-01' } });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPatients);
    });

    it('should filter by date range', async () => {
      const mockPatients: NonSensitivePatientEntry[] = [
        { id: '1', name: 'John Doe', dateOfBirth: '1980-01-01', gender: Gender.Male, occupation: 'Developer', healthRating: 85 },
        { id: '2', name: 'Jane Smith', dateOfBirth: '1990-01-01', gender: Gender.Female, occupation: 'Designer', healthRating: 90 },
      ];

      (patientService.getNonSensitiveEntries as jest.Mock).mockResolvedValue(
        mockPatients,
      );

      const response = await request(app)
        .get('/api/patients')
        .query({
          dateOfBirth: {
            '>=': '1980-01-01',
            '<=': '1990-01-01'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPatients);
    });

    it('should reject invalid date format', async () => {
      const response = await request(app)
        .get('/api/patients')
        .query({ dateOfBirth: '01-01-1980' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle filtering combinations', async () => {
      const mockPatients: NonSensitivePatientEntry[] = [
        { id: '1', name: 'John Doe', dateOfBirth: '1980-01-01', gender: Gender.Male, occupation: 'Developer', healthRating: 85 },
      ];

      (patientService.getNonSensitiveEntries as jest.Mock).mockResolvedValue(
        mockPatients,
      );

      const response = await request(app)
        .get('/api/patients')
        .query({ gender: 'male', minHealthRating: 80 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPatients);
    });
  });

  describe('POST /api/patients', () => {
    it('should create a new patient', async () => {
      const newPatient = {
        name: 'John Doe',
        dateOfBirth: '1980-01-01',
        gender: Gender.Male,
        occupation: 'Developer',
      };

      const createdPatient: Patient = {
        id: '1',
        ...newPatient,
        ssn: '123-45-6789',
        entries: [],
      };

      (patientService.createPatient as jest.Mock).mockResolvedValue(
        createdPatient,
      );

      const response = await request(app)
        .post('/api/patients')
        .send(newPatient);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdPatient);
    });

    it('should handle validation errors', async () => {
      const invalidPatient = {
        name: '',
        dateOfBirth: 'invalid',
        gender: 'invalid',
        occupation: 'Developer',
      };

      const response = await request(app)
        .post('/api/patients')
        .send(invalidPatient);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle database errors', async () => {
      const newPatient = {
        name: 'John Doe',
        dateOfBirth: '1980-01-01',
        gender: Gender.Male,
        occupation: 'Developer',
      };

      const error = new Error('Database error');
      (patientService.createPatient as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .post('/api/patients')
        .send(newPatient);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Database error' });
    });
  });

  describe('PUT /api/patients/:id', () => {
    it('should update an existing patient', async () => {
      const updatedPatient = {
        name: 'John Doe',
        dateOfBirth: '1980-01-01',
        gender: Gender.Male,
        occupation: 'Developer',
      };

      const patientWithId: Patient = {
        id: '1',
        ...updatedPatient,
        ssn: '123-45-6789',
        entries: [],
      };

      (patientService.editPatient as jest.Mock).mockResolvedValue(
        patientWithId,
      );

      const response = await request(app)
        .put('/api/patients/1')
        .send(updatedPatient);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(patientWithId);
    });

    it('should handle validation errors', async () => {
      const invalidPatient = {
        name: '',
        dateOfBirth: 'invalid',
        gender: 'invalid',
        occupation: 'Developer',
      };

      const response = await request(app)
        .put('/api/patients/1')
        .send(invalidPatient);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle database errors', async () => {
      const updatedPatient = {
        name: 'John Doe',
        dateOfBirth: '1980-01-01',
        gender: Gender.Male,
        occupation: 'Developer',
      };

      const error = new Error('Database error');
      (patientService.editPatient as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .put('/api/patients/1')
        .send(updatedPatient);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Database error' });
    });
  });

  describe('DELETE /api/patients/:id', () => {
    it('should delete a patient', async () => {
      const deletedPatient = { id: '1' };

      (patientService.deletePatient as jest.Mock).mockResolvedValue(
        deletedPatient,
      );

      const response = await request(app).delete('/api/patients/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(deletedPatient);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      (patientService.deletePatient as jest.Mock).mockRejectedValue(error);

      const response = await request(app).delete('/api/patients/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Database error' });
    });
  });
});
