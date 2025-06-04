import patients from '../../data/patients-full';
import patientsService from './patientsService';
import { NewPatientEntryWithoutEntries, NewEntryWithoutId, Gender } from '../types';
import { ValidationError, NotFoundError } from '../utils/errors';
import { HealthCheckRating } from '../types';

describe('patientsService', () => {
  const testPatient: NewPatientEntryWithoutEntries = {
    name: 'Test Patient',
    occupation: 'Tester',
    gender: Gender.Other,
    dateOfBirth: '1990-01-01'
  };

  const testEntry: NewEntryWithoutId = {
    description: 'Test entry',
    date: '2023-01-01',
    specialist: 'Dr. Test',
    type: 'HealthCheck',
    healthCheckRating: HealthCheckRating.Healthy
  };

  beforeEach(() => {
    // Reset patients array before each test
    patients.length = 0;
    patients.push(
      {
        id: '1',
        name: 'John Doe',
        occupation: 'Developer',
        gender: 'male' as Gender,
        dateOfBirth: '1980-01-01',
        entries: []
      },
      {
        id: '2',
        name: 'Jane Smith',
        occupation: 'Designer',
        gender: 'female' as Gender,
        dateOfBirth: '1985-02-15',
        entries: []
      }
    );
  });

  describe('getPatientEntries', () => {
    test('returns all patient entries', () => {
      const result = patientsService.getPatientEntries();
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('John Doe');
    });
  });

  describe('getNonSensitiveEntries', () => {
    test('returns non-sensitive patient entries', () => {
      const result = patientsService.getNonSensitiveEntries();
      expect(result.length).toBe(2);
      expect(result[0]).toEqual({
        id: '1',
        name: 'John Doe',
        dateOfBirth: '1980-01-01',
        gender: 'male',
        occupation: 'Developer',
        entries: []
      });
    });
  });

  describe('findById', () => {
    test('returns patient by id', () => {
      const result = patientsService.findById('1');
      expect(result.name).toBe('John Doe');
    });

    test('throws NotFoundError for invalid id', () => {
      expect(() => patientsService.findById('999')).toThrow(NotFoundError);
    });
  });

  describe('addPatient', () => {
    test('adds new patient', () => {
      const result = patientsService.addPatient(testPatient);
      expect(patients.length).toBe(3);
      expect(result.name).toBe('Test Patient');
    });

  test('validates required fields', () => {
    const invalidPatient = { ...testPatient, name: '' };
    expect(() => patientsService.addPatient(invalidPatient)).toThrow(ValidationError);
  });

  test('validates date format', () => {
    const invalidDatePatient = { ...testPatient, dateOfBirth: 'invalid-date' };
    expect(() => patientsService.addPatient(invalidDatePatient))
      .toThrow('Invalid date format: YYYY-MM-DD');
  });
  });

  describe('addEntry', () => {
    test('adds new entry to patient', () => {
      const patient = patients[0];
      const result = patientsService.addEntry(patient, testEntry);
      expect(patient.entries?.length).toBe(1);
      expect(result.description).toBe('Test entry');
    });

    test('validates required fields', () => {
      const patient = patients[0];
      const invalidEntry = { ...testEntry, description: '' };
      expect(() => patientsService.addEntry(patient, invalidEntry)).toThrow(ValidationError);
    });

    test('validates HealthCheck rating', () => {
      const patient = patients[0];
      const invalidEntry = { ...testEntry, healthCheckRating: 5 };
      expect(() => patientsService.addEntry(patient, invalidEntry)).toThrow(ValidationError);
    });

    test('validates entry type', () => {
      const patient = patients[0];
      // Using type assertion to bypass TypeScript for negative testing
      const invalidEntry = { ...testEntry, type: 'InvalidType' } as unknown as NewEntryWithoutId;
      expect(() => patientsService.addEntry(patient, invalidEntry)).toThrow(ValidationError);
    });
  });
});
