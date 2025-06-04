import patients from '../../data/patients-full';
import { v1 as uuid } from 'uuid';

import {
  BaseEntry,
  Entry,
  NewEntryWithoutId,
  NewPatientEntryWithoutEntries,
  NonSensitivePatientEntry,
  PatientEntry,
  HealthCheckRating
} from '../types';
import { ValidationError, NotFoundError } from '../utils/errors';


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
    entries: patient.entries || []  // Include entries for health rating calculation
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

  // Validate date format if provided
  if (entry.dateOfBirth) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(entry.dateOfBirth)) {
      throw new ValidationError(
        'Invalid date format: YYYY-MM-DD',
        { invalidField: 'dateOfBirth' }
      );
    }
  }

  const id: string = uuid();
  const newPatientEntry: PatientEntry = {
    id,
    name: entry.name,
    occupation: entry.occupation,
    gender: entry.gender,
    dateOfBirth: entry.dateOfBirth,
    entries: [],
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
  
  // HealthCheck-specific validation
  if (entry.type === 'HealthCheck') {
    if (entry.healthCheckRating === undefined) {
      throw new ValidationError(
        'Missing healthCheckRating for HealthCheck entry',
        { missingField: 'healthCheckRating' }
      );
    }
  if (entry.healthCheckRating < HealthCheckRating.Healthy || entry.healthCheckRating > HealthCheckRating.CriticalRisk) {
    throw new ValidationError(
      'Invalid healthCheckRating: must be 0-3',
      { invalidField: 'healthCheckRating' }
    );
  }
  }

  const id: string = uuid();
  const newEntry: Entry = {
    id,
    ...entry,
  };

  // Initialize entries array if undefined
  if (!patient.entries) patient.entries = [];
  patient.entries.push(newEntry);


  return newEntry;
};

export default {
  getPatientEntries,
  getNonSensitiveEntries,
  addPatient,
  addEntry,
  findById,
};
