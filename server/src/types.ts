import { z } from 'zod';
import { EntrySchema, NewPatientEntrySchema } from './utils';
import {
  DiagnosisEntry,
  Gender,
  Patient,
  BaseEntry,
  HealthCheckRating,
  HealthCheckEntry,
  Discharge,
  SickLeave,
  OccupationalHealthcareEntry,
  HospitalEntry,
  Entry,
  UnionOmit
} from '../../shared/src/types/medicalTypes';

export {
  BaseEntry,
  DiagnosisEntry,
  Gender,
  Patient,
  HealthCheckRating,
  HealthCheckEntry,
  Discharge,
  SickLeave,
  OccupationalHealthcareEntry,
  HospitalEntry,
  Entry,
};

export type PatientEntry = Patient;
export type NewPatientEntry = z.infer<typeof NewPatientEntrySchema>;
export type NewPatientEntryWithoutEntries = UnionOmit<NewPatientEntry, 'entries'>;
export type NonSensitivePatientEntry = UnionOmit<PatientEntry, 'ssn' | 'entries'>;
export type NewEntryWithoutId = UnionOmit<z.infer<typeof EntrySchema>, 'id'>;

/**
 * Type for paginated API responses
 */
export interface PaginatedResponse<T> {
  data: T;
  metadata: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}
