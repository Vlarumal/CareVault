import { z } from 'zod';
import { EntrySchema, NewPatientEntrySchema } from './utils';

export interface DiagnosisEntry {
  code: string;
  name: string;
  latin?: string;
}

export interface PatientEntry {
  id: string;
  name: string;
  ssn?: string;
  occupation: string;
  gender: Gender;
  dateOfBirth: string;
  entries?: Entry[];
}

export enum Gender {
  Female = 'female',
  Male = 'male',
  Other = 'other',
}

export type NewPatientEntry = z.infer<typeof NewPatientEntrySchema>;
export type NewPatientEntryWithoutEntries = UnionOmit<
  NewPatientEntry,
  'entries'
>;
export type NonSensitivePatientEntry = UnionOmit<
  PatientEntry,
  'ssn' | 'entries'
>;
interface BaseEntry {
  id: string;
  description: string;
  date: string;
  specialist: string;
  diagnosisCodes?: Array<DiagnosisEntry['code']>;
}

export enum HealthCheckRating {
  'Healthy' = 0,
  'LowRisk' = 1,
  'HighRisk' = 2,
  'CriticalRisk' = 3,
}

export interface HealthCheckEntry extends BaseEntry {
  type: 'HealthCheck';
  healthCheckRating: HealthCheckRating;
}

type Discharge = {
  date: string;
  criteria: string;
};

type SickLeave = {
  startDate: string;
  endDate: string;
};

export interface OccupationalHealthcareEntry extends BaseEntry {
  type: 'OccupationalHealthcare';
  employerName: string;
  sickLeave?: SickLeave;
}

export interface HospitalEntry extends BaseEntry {
  type: 'Hospital';
  discharge: Discharge;
}

export type Entry =
  | HospitalEntry
  | OccupationalHealthcareEntry
  | HealthCheckEntry;

// Define special omit for unions
type UnionOmit<
  T,
  K extends string | number | symbol
> = T extends unknown ? Omit<T, K> : never;

type NewEntry = z.infer<typeof EntrySchema>;
// Define Entry without the 'id' property
export type NewEntryWithoutId = UnionOmit<NewEntry, 'id'>;
