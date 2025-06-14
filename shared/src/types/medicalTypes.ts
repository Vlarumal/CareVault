export interface DiagnosisEntry {
  code: string;
  name: string;
  latin?: string;
  readonly uniqueCode: true;
  createdAt?: string;
  updatedAt?: string;
}

export enum Gender {
  Female = 'female',
  Male = 'male',
  Other = 'other',
}

export interface Patient {
  id: string;
  name: string;
  occupation: string;
  gender: Gender;
  ssn?: string;
  dateOfBirth?: string;
  date_of_birth?: string; // API response format
  createdAt?: string;
  updatedAt?: string;
  entries?: Entry[];
  healthRating?: number | null; // Precomputed health rating from backend
}

export type PatientFormValues = Omit<Patient, 'id' | 'entries'>;

export interface BaseEntry {
  id: string;
  description: string;
  date: string;
  specialist: string;
  diagnosisCodes?: string[]; // Changed to string[] to match data
  isOptimistic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export enum HealthCheckRating {
  Healthy = 0,
  LowRisk = 1,
  HighRisk = 2,
  CriticalRisk = 3,
}

export interface HealthCheckEntry extends BaseEntry {
  type: 'HealthCheck';
  healthCheckRating: HealthCheckRating;
  createdAt?: string;
  updatedAt?: string;
}

export interface Discharge {
  date: string;
  criteria: string;
}

export interface SickLeave {
  startDate: string;
  endDate: string;
}

export interface OccupationalHealthcareEntry extends BaseEntry {
  type: 'OccupationalHealthcare';
  employerName: string;
  sickLeave?: SickLeave;
  createdAt?: string;
  updatedAt?: string;
}

export interface HospitalEntry extends BaseEntry {
  type: 'Hospital';
  discharge: Discharge;
  createdAt?: string;
  updatedAt?: string;
}

export type Entry =
  | HospitalEntry
  | OccupationalHealthcareEntry
  | HealthCheckEntry;

export type UnionOmit<T, K extends string | number | symbol> = T extends unknown
  ? Omit<T, K>
  : never;

export type NewEntryWithoutId = UnionOmit<Entry, 'id'>;
