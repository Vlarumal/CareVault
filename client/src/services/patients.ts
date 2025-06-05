import axios from 'axios';
import { Entry, NewEntryFormValues, Patient, PatientFormValues } from '../types';
import { apiBaseUrl } from '../constants';
import { apiRetry } from '../utils/apiUtils';

const getAll = async () => {
  return apiRetry(() =>
    axios.get<Patient[]>(`${apiBaseUrl}/patients`).then(res => res.data)
  );
};

const getById = async (id: string) => {
  return apiRetry(() =>
    axios.get<Patient>(`${apiBaseUrl}/patients/${id}`).then(res => res.data)
  );
};

const create = async (object: PatientFormValues) => {
  return apiRetry(() =>
    axios.post<Patient>(`${apiBaseUrl}/patients`, object).then(res => res.data)
  );
};

const createNewEntry = async (id: string, object: NewEntryFormValues) => {
  return apiRetry(() =>
    axios.post<Entry>(`${apiBaseUrl}/patients/${id}/entries`, object).then(res => res.data)
  );
};

export default {
  getAll,
  create,
  createNewEntry,
  getById,
};
