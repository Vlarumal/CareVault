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
  /**
   * @alias dateOfBirth
   */
  date_of_birth?: string;
  /**
   * @alias deathDate
   */
  death_date?: string | null;
  createdAt?: string;
  updatedAt?: string;
  entries?: Entry[];
  healthRating?: number | null; // Precomputed health rating from backend
  
  // Backward compatibility aliases
  /** @deprecated Use date_of_birth instead */
  dateOfBirth?: string;
  /** @deprecated Use death_date instead */
  deathDate?: string | null;
}

export type PatientFormValues = Omit<Patient, 'id' | 'entries'> & {
  death_date?: string | null;
};

export interface BaseEntry {
  id: string;
  description: string;
  date: string;
  specialist: string;
  /**
   * Array of diagnosis codes associated with this entry
   * - Must be in format [A-Za-z0-9.-] (letters, numbers, dots, hyphens)
   * - Empty arrays are allowed and will be treated as no diagnoses
   * - Undefined indicates no diagnosis codes provided
   * - Empty array [] indicates no diagnoses
   */
  diagnosisCodes?: string[] | undefined;
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

export interface EntryVersion {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  editorId: string;
  changeReason?: string;
  entryId: string;
  entryData: Entry;
}

export type VersionDiff = {
  [key: string]: {
    oldValue: unknown;
    newValue: unknown;
  };
};

export type VersionedEntry<T extends Entry = Entry> = T & {
  versionId: string;
  versions: EntryVersion[];
};

export type AnyEntry =
  | HealthCheckEntry
  | OccupationalHealthcareEntry
  | HospitalEntry
  | VersionedEntry<HealthCheckEntry>
  | VersionedEntry<OccupationalHealthcareEntry>
  | VersionedEntry<HospitalEntry>;


export function isVersionedEntry(entry: AnyEntry): entry is VersionedEntry {
  return 'versions' in entry && 'versionId' in entry;
}

export function getBaseEntry(entry: AnyEntry): Entry {
  if (isVersionedEntry(entry)) {
    const { versions, versionId, ...baseEntry } = entry;
    return baseEntry;
  }
  return entry;
}

export type UnionOmit<T, K extends string | number | symbol> = T extends unknown
  ? Omit<T, K>
  : never;

/**
 * Represents a new medical entry without the auto-generated ID
 * - Used for creating new entries before they receive a database ID
 * - All properties except 'id' are required
 */
export type NewEntryWithoutId = UnionOmit<Entry, 'id'> & {
 diagnosisCodes?: string[] | null | undefined;
 version?: number;
};
