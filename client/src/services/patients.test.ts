import { describe, it, expect, vi } from 'vitest';
import patientsService from './patients';
import { api } from '../utils/apiUtils';
import { Gender, NewEntryFormValues, PatientFormValues } from '../types';

vi.mock('../utils/apiUtils', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  apiRetry: vi.fn((fn) => fn()),
}));

describe('patients service', () => {
  describe('create', () => {
    it('sends deathDate when provided', async () => {
      const mockPatient: PatientFormValues = {
        name: 'John Doe',
        occupation: 'Developer',
        gender: Gender.Male,
        ssn: '123-45-6789',
        dateOfBirth: '1990-01-01',
        deathDate: '2025-01-01'
      };

      await patientsService.create(mockPatient);
      
      expect(api.post).toHaveBeenCalledWith(
        '/patients',
        expect.objectContaining({
          deathDate: '2025-01-01'
        })
      );
    });

    it('does not send deathDate when not provided', async () => {
      const mockPatient: PatientFormValues = {
        name: 'John Doe',
        occupation: 'Developer',
        gender: Gender.Male,
        ssn: '123-45-6789',
        dateOfBirth: '1990-01-01'
      };

      await patientsService.create(mockPatient);
      
      expect(api.post).toHaveBeenCalledWith(
        '/patients',
        expect.not.objectContaining({
          deathDate: expect.anything()
        })
      );
    });
  });

  describe('updatePatient', () => {
    it('sends deathDate when provided', async () => {
      const mockPatient: PatientFormValues = {
        name: 'John Doe',
        occupation: 'Developer',
        gender: Gender.Male,
        ssn: '123-45-6789',
        dateOfBirth: '1990-01-01',
        deathDate: '2025-01-01'
      };

      await patientsService.updatePatient('patient-123', mockPatient);
      
      expect(api.put).toHaveBeenCalledWith(
        '/patients/patient-123',
        expect.objectContaining({
          deathDate: '2025-01-01'
        })
      );
    });

    it('does not send deathDate when not provided', async () => {
      const mockPatient: PatientFormValues = {
        name: 'John Doe',
        occupation: 'Developer',
        gender: Gender.Male,
        ssn: '123-45-6789',
        dateOfBirth: '1990-01-01'
      };

      await patientsService.updatePatient('patient-123', mockPatient);
      
      expect(api.put).toHaveBeenCalledWith(
        '/patients/patient-123',
        expect.not.objectContaining({
          deathDate: expect.anything()
        })
      );
    });
  });

  describe('createNewEntry', () => {
    it('sends diagnosisCodes array when provided', async () => {
      const mockEntry: NewEntryFormValues = {
        description: 'Test entry',
        date: '2025-06-20',
        specialist: 'Dr. Smith',
        type: 'HealthCheck',
        healthCheckRating: 0,
        diagnosisCodes: ['A11', 'B22'],
      };

      await patientsService.createNewEntry('patient-123', mockEntry);
      
      expect(api.post).toHaveBeenCalledWith(
        '/patients/patient-123/entries',
        expect.objectContaining({
          diagnosisCodes: ['A11', 'B22']
        })
      );
    });

    it('sends empty array when diagnosisCodes is null', async () => {
      const mockEntry: NewEntryFormValues = {
        description: 'Test entry',
        date: '2025-06-20',
        specialist: 'Dr. Smith',
        type: 'HealthCheck',
        healthCheckRating: 0,
        diagnosisCodes: null,
      };

      await patientsService.createNewEntry('patient-123', mockEntry);
      
      expect(api.post).toHaveBeenCalledWith(
        '/patients/patient-123/entries',
        expect.objectContaining({
          diagnosisCodes: []
        })
      );
    });

    it('sends empty array when diagnosisCodes is undefined', async () => {
      const mockEntry: NewEntryFormValues = {
        description: 'Test entry',
        date: '2025-06-20',
        specialist: 'Dr. Smith',
        type: 'HealthCheck',
        healthCheckRating: 0,
      } as any;

      await patientsService.createNewEntry('patient-123', mockEntry);
      
      expect(api.post).toHaveBeenCalledWith(
        '/patients/patient-123/entries',
        expect.not.objectContaining({
          diagnosisCodes: expect.anything()
        })
      );
    });
  });

  describe('updateEntry', () => {
    it('sends diagnosisCodes array when provided', async () => {
      const mockUpdate = {
        description: 'Updated entry',
        date: '2025-06-20',
        specialist: 'Dr. Smith',
        type: 'HealthCheck' as const,
        healthCheckRating: 1,
        diagnosisCodes: ['C33', 'D44'],
      };

      await patientsService.updateEntry('patient-123', 'entry-456', mockUpdate);
      
      expect(api.put).toHaveBeenCalledWith(
        '/patients/patient-123/entries/entry-456',
        expect.objectContaining({
          diagnosisCodes: ['C33', 'D44']
        })
      );
    });

    it('sends empty array when diagnosisCodes is empty', async () => {
      const mockUpdate = {
        description: 'Updated entry',
        date: '2025-06-20',
        specialist: 'Dr. Smith',
        type: 'HealthCheck' as const,
        healthCheckRating: 1,
        diagnosisCodes: [],
      };

      await patientsService.updateEntry('patient-123', 'entry-456', mockUpdate);
      
      expect(api.put).toHaveBeenCalledWith(
        '/patients/patient-123/entries/entry-456',
        expect.objectContaining({
          diagnosisCodes: []
        })
      );
    });

    it('sends empty array when diagnosisCodes is undefined', async () => {
      const mockUpdate = {
        description: 'Updated entry',
        date: '2025-06-20',
        specialist: 'Dr. Smith',
        type: 'HealthCheck',
        healthCheckRating: 1,
      } as any;

      await patientsService.updateEntry('patient-123', 'entry-456', mockUpdate);
      
      expect(api.put).toHaveBeenCalledWith(
        '/patients/patient-123/entries/entry-456', 
        expect.not.objectContaining({
          diagnosisCodes: expect.anything()
        })
      );
    });
  });
});