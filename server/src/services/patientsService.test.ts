import patients from '../../data/patients-full';
import { patientService } from './patientsService';
import { NewPatientEntryWithoutEntries, NewEntryWithoutId, Gender, PatientEntry } from '../types';
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
      const result = patientService.getPatientEntries();
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('John Doe');
    });
  });

  describe('getNonSensitiveEntries', () => {
    test('returns non-sensitive patient entries with entries included', () => {
      // Add a patient with valid entries
      patients.push({
        id: '3',
        name: 'Test Patient',
        dateOfBirth: '1990-01-01',
        gender: 'male' as Gender,
        occupation: 'Tester',
        entries: [{
          id: 'e1',
          description: 'Checkup',
          date: '2023-01-01',
          specialist: 'Dr. Test',
          type: 'HealthCheck',
          healthCheckRating: HealthCheckRating.Healthy
        }]
      });

      const result = patientService.getNonSensitiveEntries();
      expect(result.length).toBe(3);
      expect(result[2]).toEqual({
        id: '3',
        name: 'Test Patient',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        occupation: 'Tester',
        entries: [{
          id: 'e1',
          description: 'Checkup',
          date: '2023-01-01',
          specialist: 'Dr. Test',
          type: 'HealthCheck',
          healthCheckRating: HealthCheckRating.Healthy
        }]
      });
    });

    test('assigns empty array when patient has no entries', () => {
      // Add a patient with undefined entries as PatientEntry type
      const noEntriesPatient: PatientEntry = {
        id: '4',
        name: 'No Entries Patient',
        dateOfBirth: '2000-01-01',
        gender: 'female' as Gender,
        occupation: 'Teacher',
        entries: undefined
      };
      patients.push(noEntriesPatient);

      const result = patientService.getNonSensitiveEntries();
      const patientInResult = result.find(p => p.id === '4');
      
      // Use toHaveProperty matcher to avoid type errors
      expect(patientInResult).toHaveProperty('entries', []);
    });
  });

  describe('findById', () => {
    test('returns patient by id', () => {
      const result = patientService.findById('1');
      expect(result.name).toBe('John Doe');
    });

    test('throws NotFoundError for invalid id', () => {
      expect(() => patientService.findById('999')).toThrow(NotFoundError);
      expect(() => patientService.findById('999')).toThrowError('Patient with ID 999 not found');
    });
  });

  describe('addPatient', () => {
    test('adds new patient', () => {
      const result = patientService.addPatient(testPatient);
      expect(patients.length).toBe(3);
      expect(result.name).toBe('Test Patient');
    });

    test('validates required fields', () => {
      const invalidName = { ...testPatient, name: '' };
      expect(() => patientService.addPatient(invalidName)).toThrow(ValidationError);
      
      const invalidOccupation = { ...testPatient, occupation: '' };
      expect(() => patientService.addPatient(invalidOccupation)).toThrow(ValidationError);
    });

    test('validates date format', () => {
      const invalidDatePatient = { ...testPatient, dateOfBirth: 'invalid-date' };
      expect(() => patientService.addPatient(invalidDatePatient))
        .toThrow('Invalid date format: YYYY-MM-DD');
    });

    test('sanitizes input against XSS attacks and validates required fields', () => {
      const maliciousPatient = {
        ...testPatient,
        name: '<script>alert("XSS")</script>John',
        occupation: '<img src=x onerror=alert(1)>'
      };

      expect(() => patientService.addPatient(maliciousPatient))
        .toThrow(ValidationError);
    });
  });

  describe('addEntry', () => {
    test('adds new entry to patient', () => {
      const patient = patients[0];
      const result = patientService.addEntry(patient, testEntry);
      expect(patient.entries?.length).toBe(1);
      expect(result.description).toBe('Test entry');
    });

    test('sanitizes entry input against XSS attacks and validates required fields', () => {
      const patient = patients[0];
      const maliciousEntry = {
        ...testEntry,
        description: '<script>alert("XSS")</script>Checkup',
        specialist: '<img src=x onerror=alert(1)>'
      };

      expect(() => patientService.addEntry(patient, maliciousEntry))
        .toThrow(ValidationError);
    });

    test('initializes entries array when undefined', () => {
      // Create a patient object with undefined entries
      const patient = { ...patients[0], entries: undefined } as PatientEntry;
      
      const result = patientService.addEntry(patient, testEntry);
      
      // Verify the entries array was initialized
      expect(patient.entries).toBeDefined();
      expect(patient.entries?.length).toBe(1);
      expect(result.description).toBe('Test entry');
    });

    test('validates required fields', () => {
      const patient = patients[0];
      const invalidDescription = { ...testEntry, description: '' };
      expect(() => patientService.addEntry(patient, invalidDescription)).toThrow(ValidationError);
      
      const invalidDate = { ...testEntry, date: '' };
      expect(() => patientService.addEntry(patient, invalidDate)).toThrow(ValidationError);
      
      const invalidSpecialist = { ...testEntry, specialist: '' };
      expect(() => patientService.addEntry(patient, invalidSpecialist)).toThrow(ValidationError);
    });

    test('validates HealthCheck rating', () => {
      const patient = patients[0];
      const invalidHigh = { ...testEntry, healthCheckRating: 5 };
      expect(() => patientService.addEntry(patient, invalidHigh)).toThrow(ValidationError);
      
      const invalidLow = { ...testEntry, healthCheckRating: -1 };
      expect(() => patientService.addEntry(patient, invalidLow)).toThrow(ValidationError);
      
      const boundaryHigh = { ...testEntry, healthCheckRating: 3 };
      expect(() => patientService.addEntry(patient, boundaryHigh)).not.toThrow();
    });

    test('validates missing HealthCheck rating', () => {
      const patient = patients[0];
      // Create invalid entry without healthCheckRating
      const missingRating = { ...testEntry, healthCheckRating: undefined } as unknown as NewEntryWithoutId;
      expect(() => patientService.addEntry(patient, missingRating))
        .toThrow('Missing healthCheckRating for HealthCheck entry');
    });

    test('validates entry type', () => {
      const patient = patients[0];
      // Using type assertion to bypass TypeScript for negative testing
      const invalidEntry = { ...testEntry, type: 'InvalidType' } as unknown as NewEntryWithoutId;
      expect(() => patientService.addEntry(patient, invalidEntry)).toThrow(ValidationError);
    });
    
    test('adds Hospital entry', () => {
      const patient = patients[0];
      const hospitalEntry: NewEntryWithoutId = {
        description: 'Hospital stay',
        date: '2023-01-05',
        specialist: 'Dr. Smith',
        type: 'Hospital',
        discharge: {
          date: '2023-01-10',
          criteria: 'Recovered'
        }
      };
      const result = patientService.addEntry(patient, hospitalEntry);
      expect(result.type).toBe('Hospital');
      expect(patient.entries?.length).toBe(1);
    });

    test('adds OccupationalHealthcare entry', () => {
      const patient = patients[0];
      const occupationalEntry: NewEntryWithoutId = {
        description: 'Work injury',
        date: '2023-01-07',
        specialist: 'Dr. Jones',
        type: 'OccupationalHealthcare',
        employerName: 'Acme Inc'
      };
      const result = patientService.addEntry(patient, occupationalEntry);
      expect(result.type).toBe('OccupationalHealthcare');
      expect(patient.entries?.length).toBe(1);
    });
  });
});
