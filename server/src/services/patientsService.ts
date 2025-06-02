import patients from '../../data/patients-full';
import { v1 as uuid } from 'uuid';

import {
  BaseEntry,
  Entry,
  NewEntryWithoutId,
  NewPatientEntryWithoutEntries,
  NonSensitivePatientEntry,
  PatientEntry
} from '../types';
import { ValidationError, NotFoundError } from '../utils/errors';

// Helper to compute health rating from entries
const computeHealthRating = (patient: PatientEntry): number | null => {
  if (!patient.entries || patient.entries.length === 0) return null;
  
  const healthChecks = patient.entries.filter(
    e => e.type === 'HealthCheck'
  );
  
  return healthChecks.length > 0 
    ? healthChecks[healthChecks.length-1].healthCheckRating
    : null;
};

const getPatientEntries = (): PatientEntry[] => {
  return patients;
};

const getNonSensitiveEntries = (): NonSensitivePatientEntry[] => {
  return patients.map(patient => ({
    id: patient.id,
    name: patient.name,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    occupation: patient.occupation,
    healthRating: computeHealthRating(patient)
  }));
};

const findById = (id: string): PatientEntry => {
  const patient = patients.find(patient => patient.id === id);
  if (!patient) {
    throw new NotFoundError('Patient', id);
  }
  return patient;
};

const addPatient = (
  entry: NewPatientEntryWithoutEntries
): PatientEntry => {

  // Validate required fields
  const requiredFields: Array<keyof NewPatientEntryWithoutEntries> = ['name', 'occupation', 'gender'];
  const missingFields = requiredFields.filter(field => !entry[field]);
  
  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`,
      { missingFields }
    );
  }

  const id: string = uuid();
  const newPatientEntry: PatientEntry = {
    id,
    name: entry.name,
    occupation: entry.occupation,
    gender: entry.gender,
    dateOfBirth: entry.dateOfBirth,
    entries: [],
    healthRating: null
  };

  patients.push(newPatientEntry);
  return newPatientEntry;
};

const addEntry = (
  patient: PatientEntry,
  entry: NewEntryWithoutId
): Entry => {
  // Validate base entry fields
  const baseFields: Array<keyof BaseEntry> = ['description', 'date', 'specialist'];
  const missingBaseFields = baseFields.filter(field => !entry[field as keyof NewEntryWithoutId]);
  
  if (missingBaseFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingBaseFields.join(', ')}`,
      { missingBaseFields }
    );
  }

  // Validate entry type
  if (!['Hospital', 'OccupationalHealthcare', 'HealthCheck'].includes(entry.type)) {
    throw new ValidationError(
      `Invalid entry type: ${entry.type}`,
      { invalidType: entry.type }
    );
  }

  const id: string = uuid();
  const newEntry: Entry = {
    id,
    ...entry,
  };

  // Initialize entries array if undefined
  if (!patient.entries) patient.entries = [];
  patient.entries.push(newEntry);

  // Update health rating if HealthCheck entry
  if (entry.type === 'HealthCheck') {
    patient.healthRating = entry.healthCheckRating;
  }

  return newEntry;
};

export default {
  getPatientEntries,
  getNonSensitiveEntries,
  addPatient,
  addEntry,
  findById,
};
