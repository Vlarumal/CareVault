import { z } from 'zod';
import { EntrySchema, NewPatientEntrySchema } from './utils';
import type * as MedicalTypes from '../../shared/src/types/medicalTypes';

export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE';

// Re-export shared types
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
  Entry
} from '../../shared/src/types/medicalTypes';

export type EntryVersion = MedicalTypes.EntryVersion;

export type PatientEntry = MedicalTypes.Patient & {
  deathDate?: Date | null;
};

export type NewPatientEntry = z.infer<typeof NewPatientEntrySchema>;
export type NewPatientEntryWithoutEntries = MedicalTypes.UnionOmit<NewPatientEntry, 'entries'> & {
  deathDate?: string | null;
};
export type NonSensitivePatientEntry = MedicalTypes.UnionOmit<PatientEntry, 'ssn' | 'entries'> & {
  healthRating: number | null;
  deathDate?: string | null;
};
export type NewEntryWithoutId = MedicalTypes.UnionOmit<z.infer<typeof EntrySchema>, 'id'> & {
  changeReason?: string;
  updatedAt?: string;
  diagnosisCodes?: string[] | null;
};

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
