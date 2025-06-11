import { Gender, Patient, HealthCheckEntry, HospitalEntry, OccupationalHealthcareEntry } from '../types';

export const createMockPatient = (overrides: Partial<Patient> = {}): Omit<Patient, 'id'> => ({
  name: 'Test Patient',
  dateOfBirth: '1990-01-01',
  gender: Gender.Male,
  occupation: 'Engineer',
  ssn: '123-45-6789',
  ...overrides
});

export const createMockHealthCheckEntry = (overrides: Partial<Omit<HealthCheckEntry, 'id'>> = {}): Omit<HealthCheckEntry, 'id'> => ({
  description: 'Health check',
  date: '2023-01-01',
  specialist: 'Dr. Health',
  type: 'HealthCheck',
  healthCheckRating: 0,
  ...overrides
});

export const createMockHospitalEntry = (overrides: Partial<Omit<HospitalEntry, 'id'>> = {}): Omit<HospitalEntry, 'id'> => ({
  description: 'Hospital visit',
  date: '2023-02-01',
  specialist: 'Dr. Hospital',
  type: 'Hospital',
  discharge: {
    date: '2023-02-05',
    criteria: 'Recovered'
  },
  ...overrides
});

export const createMockOccupationalEntry = (overrides: Partial<Omit<OccupationalHealthcareEntry, 'id'>> = {}): Omit<OccupationalHealthcareEntry, 'id'> => ({
  description: 'Work injury',
  date: '2023-03-01',
  specialist: 'Dr. Occupation',
  type: 'OccupationalHealthcare',
  employerName: 'Test Company',
  sickLeave: {
    startDate: '2023-03-01',
    endDate: '2023-03-07'
  },
  ...overrides
});