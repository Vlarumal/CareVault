import axios from 'axios';
import { Entry, NewEntryFormValues, Patient, PatientFormValues } from '../types';
import { apiBaseUrl } from '../constants';
import { apiRetry } from '../utils/apiUtils';

type PatientResponse = PaginatedResponse<Patient[]> | Patient[];

export interface PaginatedResponse<T> {
  data: T;
  metadata: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

const getAll = async (page = 1, pageSize = 10) => {
  try {
    const response = await apiRetry(() =>
      axios.get(`${apiBaseUrl}/patients`, {
        params: { page, pageSize }
      })
    );

    // Check if response is paginated or non-paginated
    if ('metadata' in response.data) {
      // Paginated response
      return response.data as PaginatedResponse<Patient[]>;
    } else {
      // Non-paginated response
      return { data: response.data as Patient[], metadata: null };
    }
  } catch (error) {
    throw error;
  }
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
