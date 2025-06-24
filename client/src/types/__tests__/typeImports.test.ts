import { expect, test } from 'vitest';
import { Gender, PatientEntry } from '../../types';
import { Patient } from '../../../../shared/src/types/medicalTypes';

test('PatientEntry should extend Patient with entries', () => {
  const patient: Patient = {
    id: '1',
    name: 'John Doe',
    occupation: 'Developer',
    gender: Gender.Male
  };

  const patientEntry: PatientEntry = {
    ...patient,
    entries: []
  };

  expect(patientEntry.entries).toEqual([]);
});