import { Patient } from '../types';


export const mapToGridData = (patients: Patient[]) => {
  return patients.map(patient => ({
    ...patient,
  }));
};
