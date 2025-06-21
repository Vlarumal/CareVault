import * as medicalTypes from '@shared/src/types/medicalTypes';

export type Gender = medicalTypes.Gender;
export const Gender = medicalTypes.Gender;
export const HealthCheckRating = medicalTypes.HealthCheckRating;

export type {
  DiagnosisEntry,
  Patient,
  PatientFormValues,
  BaseEntry,
  HealthCheckEntry,
  Discharge,
  SickLeave,
  OccupationalHealthcareEntry,
  HospitalEntry,
  Entry,
  VersionedEntry,
  AnyEntry,
  UnionOmit,
  NewEntryWithoutId,
} from '@shared/src/types/medicalTypes';

export type PatientEntry = medicalTypes.Patient & {
  entries: medicalTypes.AnyEntry[];
  deathDate?: string | null;
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
  lastUpdated?: string;
  changeReason?: string;
}

export type { EntryVersion, VersionDiff } from '@shared/src/types/medicalTypes';
