import { z } from 'zod';
import { EntrySchema, NewPatientEntrySchema } from './utils';

export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE';
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
  UnionOmit,
  Entry
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

export type EntryVersionData = Entry & {
  versionId: string;
  createdAt?: string;
  updatedAt?: string;
  editorId: string;
  changeReason?: string;
};

export type EntryVersion = {
  id: string;
  entryId: string;
  createdAt?: string;
  updatedAt?: string;
  editorId: string;
  changeReason?: string;
  entryData: Entry;
};

export type PatientEntry = Patient & {
  deathDate?: Date | null;
  death_date?: Date | null;
};
export type NewPatientEntry = z.infer<typeof NewPatientEntrySchema>;
export type NewPatientEntryWithoutEntries = UnionOmit<NewPatientEntry, 'entries'> & {
  deathDate?: string | null;
};
export type NonSensitivePatientEntry = UnionOmit<PatientEntry, 'ssn' | 'entries'> & {
  healthRating: number | null;
  deathDate?: string | null;
  death_date?: Date | null;
};
export type NewEntryWithoutId = UnionOmit<z.infer<typeof EntrySchema>, 'id'> & {
  changeReason?: string;
  lastUpdated?: string;
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
