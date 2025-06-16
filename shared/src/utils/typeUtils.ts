import {
  Entry,
  HealthCheckEntry,
  HospitalEntry,
  OccupationalHealthcareEntry
} from '../types/medicalTypes';
import { NewEntryFormValues } from '../../../client/src/types';

export const entryToFormValues = (entry: Entry): NewEntryFormValues => {
  const baseValues = {
    description: entry.description,
    date: entry.date,
    specialist: entry.specialist,
    diagnosisCodes: entry.diagnosisCodes || [],
    type: entry.type,
    lastUpdated: entry.updatedAt
  };

  switch (entry.type) {
    case 'HealthCheck':
      return {
        ...baseValues,
        healthCheckRating: (entry as HealthCheckEntry).healthCheckRating
      };
    case 'Hospital':
      return {
        ...baseValues,
        discharge: {
          date: (entry as HospitalEntry).discharge.date,
          criteria: (entry as HospitalEntry).discharge.criteria
        }
      };
    case 'OccupationalHealthcare':
      const occEntry = entry as OccupationalHealthcareEntry;
      return {
        ...baseValues,
        employerName: occEntry.employerName,
        sickLeave: occEntry.sickLeave ? {
          startDate: occEntry.sickLeave.startDate,
          endDate: occEntry.sickLeave.endDate
        } : undefined
      };
    default:
      const exhaustiveCheck: never = entry;
      throw new Error(`Unknown entry type: ${exhaustiveCheck}`);
  }
};