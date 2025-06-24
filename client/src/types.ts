import * as medicalTypes from '../../shared/src/types/medicalTypes';

// Re-export as namespace for external use
export * as medicalTypes from '../../shared/src/types/medicalTypes';

// Explicitly export all needed types
export type Gender = medicalTypes.Gender;
export const Gender = medicalTypes.Gender;
export const HealthCheckRating = medicalTypes.HealthCheckRating;
export type Patient = medicalTypes.Patient;
export type PatientFormValues = medicalTypes.PatientFormValues;
export type Entry = medicalTypes.Entry;
export type DiagnosisEntry = medicalTypes.DiagnosisEntry;
export type HealthCheckEntry = medicalTypes.HealthCheckEntry;
export type HospitalEntry = medicalTypes.HospitalEntry;
export type OccupationalHealthcareEntry = medicalTypes.OccupationalHealthcareEntry;
export type AnyEntry = medicalTypes.AnyEntry;

export type PatientEntry = medicalTypes.Patient & {
  entries: medicalTypes.AnyEntry[];
};

export interface NewEntryFormValues {
  type: 'HealthCheck' | 'Hospital' | 'OccupationalHealthcare';
  description: string;
  date: string;
  specialist: string;
  diagnosisCodes?: string[] | null;
  healthCheckRating?: number;
  discharge?: {
    date: string;
    criteria: string;
  };
  employerName?: string;
  sickLeave?: {
    startDate: string;
    endDate: string;
  };
  updatedAt?: string;
  changeReason?: string;
  version?: number;
}

export interface LoginResponse {
  token: string;
}
