import patients from '../../data/patients-full';
import { v1 as uuid } from 'uuid';

import {
  type BaseEntry,
  type Entry,
  type NewEntryWithoutId,
  type NonSensitivePatientEntry,
  type PatientEntry,
  type PaginatedResponse,
  NewPatientEntryWithoutEntries,
  HealthCheckRating
} from '../types';
import { ValidationError, NotFoundError } from '../utils/errors';
import { sanitizeObject } from '../utils/sanitize';

/**
 * Get all patient entries (for internal use)
 */
const getPatientEntries = (): PatientEntry[] => {
  return patients;
};

/**
 * Get non-sensitive patient entries (for public API)
 */
const getNonSensitiveEntries = (): NonSensitivePatientEntry[] => {
  return patients.map(patient => ({
    id: patient.id,
    name: patient.name,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    occupation: patient.occupation,
    entries: patient.entries || []  // Include entries for health rating calculation
  }));
};

/**
 * Get all non-sensitive patient entries (non-paginated)
 */
const getAllNonSensitiveEntries = (): NonSensitivePatientEntry[] => {
  return getNonSensitiveEntries();
};

/**
 * Get paginated non-sensitive patient entries
 * @param page Current page number (1-based)
 * @param pageSize Number of items per page
 * @returns Paginated response with metadata
 */
const getPaginatedNonSensitiveEntries = (
  page: number = 1,
  pageSize: number = 10
): PaginatedResponse<NonSensitivePatientEntry[]> => {
  const allEntries = getNonSensitiveEntries();
  const totalItems = allEntries.length;

  // Calculate pagination values
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  // Get paginated entries
  const entries = allEntries.slice(startIndex, endIndex);

  // Return paginated response with metadata
  return {
    data: entries,
    metadata: {
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: pageSize
    }
  };
};

/**
 * Find patient by ID
 * @param id Patient ID
 * @returns Patient entry
 */
const findById = (id: string): PatientEntry => {
  const patient = patients.find(patient => patient.id === id);
  if (!patient) {
    throw new NotFoundError('Patient', id);
  }
  return patient;
};

/**
 * Add a new patient
 * @param entry Patient data
 * @returns Created patient entry
 */
const addPatient = (
  entry: NewPatientEntryWithoutEntries
): PatientEntry => {
  // Sanitize input first
  const sanitizedEntry = sanitizeObject(entry);

  // Validate required fields
  const requiredFields: Array<keyof NewPatientEntryWithoutEntries> = ['name', 'occupation', 'gender'];
  const missingFields = requiredFields.filter(field => !sanitizedEntry[field]);

  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`,
      { missingFields }
    );
  }

  if (sanitizedEntry.dateOfBirth) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(sanitizedEntry.dateOfBirth)) {
      throw new ValidationError(
        'Invalid date format: YYYY-MM-DD',
        { invalidField: 'dateOfBirth' }
      );
    }
  }

  const id: string = uuid();
const newPatientEntry: PatientEntry = {
  id,
  name: sanitizedEntry.name,
  occupation: sanitizedEntry.occupation,
  gender: sanitizedEntry.gender,
  dateOfBirth: sanitizedEntry.dateOfBirth,
  entries: [] as Entry[],  // Explicit type for immutability
};

  patients.push(newPatientEntry);
  return newPatientEntry;
};

/**
 * Add an entry to a patient
 * @param patient Patient to add entry to
 * @param entry Entry data
 * @returns Created entry
 */
const addEntry = (
  patient: PatientEntry,
  entry: NewEntryWithoutId
): Entry => {
  // Sanitize input first
  const sanitizedEntry = sanitizeObject(entry);

  // Validate base entry fields
  const baseFields: Array<keyof BaseEntry> = ['description', 'date', 'specialist'];
  const missingBaseFields = baseFields.filter(field => !sanitizedEntry[field as keyof NewEntryWithoutId]);

  if (missingBaseFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingBaseFields.join(', ')}`,
      { missingBaseFields }
    );
  }

  // Validate entry type
  if (!['Hospital', 'OccupationalHealthcare', 'HealthCheck'].includes(sanitizedEntry.type)) {
    throw new ValidationError(
      `Invalid entry type: ${sanitizedEntry.type}`,
      { invalidType: sanitizedEntry.type }
    );
  }

  if (sanitizedEntry.type === 'HealthCheck') {
    if (sanitizedEntry.healthCheckRating === undefined) {
      throw new ValidationError(
        'Missing healthCheckRating for HealthCheck entry',
        { missingField: 'healthCheckRating' }
      );
    }
  if (sanitizedEntry.healthCheckRating < HealthCheckRating.Healthy || sanitizedEntry.healthCheckRating > HealthCheckRating.CriticalRisk) {
    throw new ValidationError(
      'Invalid healthCheckRating: must be 0-3',
      { invalidField: 'healthCheckRating' }
    );
  }
  }

  const id: string = uuid();
const newEntry: Entry = {
  id,
  ...sanitizedEntry,
} as const;  // Ensure immutability

  // Ensure entries is an array
  if (!Array.isArray(patient.entries)) {
    patient.entries = [];
  }
  patient.entries.push(newEntry);

  return newEntry;
};

// Using named exports for better tree-shaking
export const patientService = {
  getPatientEntries,
  getNonSensitiveEntries,
  getAllNonSensitiveEntries,
  getPaginatedNonSensitiveEntries,
  addPatient,
  addEntry,
  findById,
};
