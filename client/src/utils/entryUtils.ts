import {
  Entry,
  NewEntryFormValues,
  HealthCheckEntry,
  HospitalEntry,
  OccupationalHealthcareEntry,
} from '../types';
import { HealthCheckRating, type NewEntryWithoutId } from '@shared/src/types/medicalTypes';

/**
 * Deep merge for entry updates while preserving type-specific structure
 */
export const mergeEntryUpdates = (
  existing: Entry,
  updates: NewEntryFormValues
): Entry => {
  const mergedBase = {
    ...existing,
    ...updates,
    type: existing.type,
  };

  switch (existing.type) {
    case 'HealthCheck':
      const healthCheckRating =
        updates.healthCheckRating ??
        (existing.type === 'HealthCheck' ? existing.healthCheckRating : HealthCheckRating.Healthy);
        
      return {
        ...mergedBase,
        healthCheckRating,
      } as HealthCheckEntry;

    case 'Hospital':
      const discharge =
        updates.discharge ??
        (existing.type === 'Hospital' ? existing.discharge : null);
        
      return {
        ...mergedBase,
        discharge,
      } as HospitalEntry;

    case 'OccupationalHealthcare':
      const employerName =
        updates.employerName ??
        (existing.type === 'OccupationalHealthcare' ? existing.employerName : '');
      const sickLeave =
        updates.sickLeave ??
        (existing.type === 'OccupationalHealthcare' ? existing.sickLeave : null);
        
      return {
        ...mergedBase,
        employerName,
        sickLeave,
      } as OccupationalHealthcareEntry;

    default:
      return mergedBase as Entry;
  }
};

/**
 * Get a human-readable description for an entry
 */
export const getEntryDescription = (entry: Entry): string => {
  switch (entry.type) {
    case 'HealthCheck':
      return `Health Check (${entry.date})`;
    case 'Hospital':
      return `Hospital Admission (${entry.date})`;
    case 'OccupationalHealthcare':
      return `Occupational Healthcare (${entry.employerName}, ${entry.date})`;
    default:
      const unknownEntry = entry as Entry;
      return `Entry (${unknownEntry.date})`;
  }
};

/**
 * Prepares form values for API submission with proper diagnosisCodes formatting
 * - Converts empty arrays to null
 * - Filters out null/empty values
 */

export function prepareEntryData(
  values: NewEntryFormValues
): NewEntryWithoutId {
  console.debug('[DEBUG] prepareEntryData - Original values:', values);
  
  let diagnosisCodes: string[] = [];
  
  if (Array.isArray(values.diagnosisCodes)) {
    diagnosisCodes = values.diagnosisCodes
      .flatMap(code =>
        Array.isArray(code)
          ? code.filter(c => c != null && c.trim() !== '')
          : [code]
      )
      .filter(code => code != null && code.trim() !== '')
      .map(code => code.trim());
  }

  console.debug('[DEBUG] prepareEntryData - Cleaned diagnosis codes:', diagnosisCodes);

  const result = {
    ...values,
    diagnosisCodes: diagnosisCodes.length > 0 ? diagnosisCodes : [],
  } as NewEntryWithoutId;

  console.debug('[DEBUG] prepareEntryData - Result:', result);
  return result;
}
