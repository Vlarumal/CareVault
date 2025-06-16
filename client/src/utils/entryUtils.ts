import { Entry, NewEntryFormValues, HealthCheckEntry, HospitalEntry, OccupationalHealthcareEntry } from '../types';

/**
 * Deep merge for entry updates while preserving type-specific structure
 */
export const mergeEntryUpdates = (existing: Entry, updates: NewEntryFormValues): Entry => {
  const mergedBase = {
    ...existing,
    ...updates,
    type: existing.type
  };

  switch (existing.type) {
    case 'HealthCheck':
      return {
        ...mergedBase,
        healthCheckRating: updates.healthCheckRating ?? (existing as HealthCheckEntry).healthCheckRating
      } as HealthCheckEntry;
      
    case 'Hospital':
      return {
        ...mergedBase,
        discharge: updates.discharge ?? (existing as HospitalEntry).discharge
      } as HospitalEntry;
      
    case 'OccupationalHealthcare':
      return {
        ...mergedBase,
        employerName: updates.employerName ?? (existing as OccupationalHealthcareEntry).employerName,
        sickLeave: updates.sickLeave ?? (existing as OccupationalHealthcareEntry).sickLeave
      } as OccupationalHealthcareEntry;
      
    default:
      return mergedBase as Entry;
  }
};