import { describe, expect, it } from '@jest/globals';
import { EntrySchema, PatientEntrySchema, validateDiagnosisCodes } from './validation';
import { HealthCheckRating } from '../types';
import { isSSN } from '../../../shared/src/utils/validation';
import { CreatePatientSchema, UpdatePatientSchema } from '../schemas/patient.schema';

describe('validation utilities', () => {
  describe('isSSN', () => {
    it('validates correct SSN format and checksum', () => {
      expect(isSSN('123-45-6789')).toBe(true);
    });

    it('rejects invalid SSN format', () => {
      expect(isSSN('123456789')).toBe(false);
      expect(isSSN('123-45-678')).toBe(false);
      expect(isSSN('123-4-56789')).toBe(false);
    });

    it('rejects SSN with invalid checksum', () => {
      expect(isSSN('123-45-6780')).toBe(false);
    });
  });

  describe('PatientEntrySchema', () => {
    it('validates patient data', () => {
      const validPatient = {
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        ssn: '123-45-6789',
        gender: 'male',
        occupation: 'Developer'
      };
      
      expect(() => PatientEntrySchema.parse(validPatient)).not.toThrow();
    });

    it('enforces max length for name', () => {
      const longName = 'a'.repeat(101);
      const patient = {
        name: longName,
        dateOfBirth: '1990-01-01',
        ssn: '123-45-6789',
        gender: 'male',
        occupation: 'Developer'
      };
      
      expect(() => PatientEntrySchema.parse(patient)).toThrow('must be at most 100 characters');
    });

    it('enforces max length for occupation', () => {
      const longOccupation = 'a'.repeat(101);
      const patient = {
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        ssn: '123-45-6789',
        gender: 'male',
        occupation: longOccupation
      };
      
      expect(() => PatientEntrySchema.parse(patient)).toThrow('must be at most 100 characters');
    });

    it('rejects invalid SSN', () => {
      const patient = {
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        ssn: 'invalid-ssn',
        gender: 'male',
        occupation: 'Developer'
      };
      
      expect(() => PatientEntrySchema.parse(patient)).toThrow('Invalid SSN format');
    });
  });

  describe('Patient Schemas', () => {
    const basePatient = {
      name: 'John Doe',
      ssn: '123-45-6789',
      occupation: 'Engineer',
      gender: 'male',
      dateOfBirth: '1990-01-01'
    };

    it('valid deathDate format', () => {
      const data = { ...basePatient, deathDate: '2023-01-01' };
      expect(() => CreatePatientSchema.parse(data)).not.toThrow();
    });

    it('invalid deathDate format', () => {
      const data = { ...basePatient, deathDate: '2023/01/01' };
      expect(() => CreatePatientSchema.parse(data)).toThrow('Invalid date format. Use YYYY-MM-DD');
    });

    it('deathDate before birthDate', () => {
      const data = { ...basePatient, deathDate: '1989-12-31' };
      expect(() => CreatePatientSchema.parse(data)).toThrow('Death date must be after birth date');
    });

    it('deathDate in future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const data = { ...basePatient, deathDate: futureDate.toISOString().split('T')[0] };
      expect(() => CreatePatientSchema.parse(data)).toThrow('Death date cannot be in the future');
    });

    it('update with valid deathDate', () => {
      const update = { deathDate: '2023-01-01' };
      expect(() => UpdatePatientSchema.parse(update)).not.toThrow();
    });

    it('update with invalid deathDate format', () => {
      const update = { deathDate: '2023/01/01' };
      expect(() => UpdatePatientSchema.parse(update)).toThrow('Invalid date format. Use YYYY-MM-DD');
    });

    it('allows deathDate to be missing', () => {
      const data = { ...basePatient };
      expect(() => CreatePatientSchema.parse(data)).not.toThrow();
    });

    it('allows deathDate to be null', () => {
      const data = { ...basePatient, deathDate: null };
      expect(() => CreatePatientSchema.parse(data)).not.toThrow();
    });
  });

  describe('EntrySchema', () => {
    it('validates health check entry', () => {
      const entry = {
        type: 'HealthCheck',
        description: 'Regular checkup',
        date: '2023-01-01',
        specialist: 'Dr. Smith',
        healthCheckRating: HealthCheckRating.Healthy
      };
      
      expect(() => EntrySchema.parse(entry)).not.toThrow();
    });

    it('enforces max length for description', () => {
      const longDescription = 'a'.repeat(501);
      const entry = {
        type: 'HealthCheck',
        description: longDescription,
        date: '2023-01-01',
        specialist: 'Dr. Smith',
        healthCheckRating: HealthCheckRating.Healthy
      };
      
      expect(() => EntrySchema.parse(entry)).toThrow('must be at most 500 characters');
    });

    it('enforces max length for specialist', () => {
      const longSpecialist = 'a'.repeat(101);
      const entry = {
        type: 'HealthCheck',
        description: 'Regular checkup',
        date: '2023-01-01',
        specialist: longSpecialist,
        healthCheckRating: HealthCheckRating.Healthy
      };
      
      expect(() => EntrySchema.parse(entry)).toThrow('must be at most 100 characters');
    });

    it('enforces max length for diagnosis codes', () => {
      const longCode = 'a'.repeat(51);
      const entry = {
        type: 'HealthCheck',
        description: 'Regular checkup',
        date: '2023-01-01',
        specialist: 'Dr. Smith',
        healthCheckRating: HealthCheckRating.Healthy,
        diagnosisCodes: [longCode]
      };
      
      expect(() => EntrySchema.parse(entry)).toThrow('must be at most 50 characters');
    });
  });

  describe('validateDiagnosisCodes', () => {
    it('validates diagnosis codes', () => {
      expect(() => validateDiagnosisCodes(['M25.5', 'J10.1'])).not.toThrow();
    });

    it('rejects invalid diagnosis codes', () => {
      expect(() => validateDiagnosisCodes(['invalid!'])).toThrow('Invalid diagnosis code format');
    });
  });
});