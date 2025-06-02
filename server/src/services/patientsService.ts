import patients from '../../data/patients-full';
import { v1 as uuid } from 'uuid';

import {
  Entry,
  NewEntryWithoutId,
  NewPatientEntryWithoutEntries,
  NonSensitivePatientEntry,
  PatientEntry,
} from '../types';

const getPatientEntries = (): PatientEntry[] => {
  return patients;
};

const getNonSensitiveEntries = (): NonSensitivePatientEntry[] => {
  return patients.map(
    ({ id, name, dateOfBirth, gender, occupation }) => ({
      id,
      name,
      dateOfBirth,
      gender,
      occupation,
    })
  );
};

const findById = (id: string): PatientEntry | undefined => {
  const entry = patients.find((patient) => patient.id === id);
  return entry;
};

const addPatient = (
  entry: NewPatientEntryWithoutEntries
): PatientEntry => {
  const id: string = uuid();
  const newPatientEntry = {
    id,
    entries: [],
    ...entry,
  };

  patients.push(newPatientEntry);
  return newPatientEntry;
};

const addEntry = (
  patient: PatientEntry,
  entry: NewEntryWithoutId
): Entry => {
  const id: string = uuid();
  const newEntry: Entry = {
    id,
    ...entry,
  };

  if (patient.entries) {
    patient.entries.push(newEntry);
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
