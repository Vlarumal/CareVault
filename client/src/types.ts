import * as medicalTypes from '@shared/src/types/medicalTypes';

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
  UnionOmit,
  NewEntryWithoutId as NewEntryFormValues,
  OptimisticEntry
} from '@shared/src/types/medicalTypes';
