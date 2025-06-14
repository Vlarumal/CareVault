import axios from 'axios';
import qs from 'qs';
import {
  Entry,
  NewEntryFormValues,
  Patient,
  PatientFormValues,
} from '../types';
import { apiBaseUrl } from '../constants';
import { apiRetry } from '../utils/apiUtils';
import { toServerFilter } from '../utils/gridFilterConverter';

export interface PaginatedResponse<T> {
  data: T;
  metadata: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

interface FilterModel {
  items: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
}

interface SortModel {
  field: string;
  sort: 'asc' | 'desc';
}

const getAll = async (
  withEntries = false,
  page = 1,
  pageSize = 10,
  filterModel: FilterModel | null = null,
  sortModel: SortModel | null = null,
  searchText?: string
) => {
  const serverFilter = filterModel
    ? toServerFilter(filterModel)
    : null;
  const params = {
    withEntries,
    page,
    pageSize,
    ...(serverFilter && { filterModel: qs.stringify(serverFilter) }),
    ...(sortModel && { sortModel: qs.stringify(sortModel) }),
    ...(searchText && { searchText }),
  };

  const response = await apiRetry(() =>
    axios.get(`${apiBaseUrl}/patients`, { params })
  );

  return response.data as PaginatedResponse<Patient[]>;
};

const getById = async (id: string) => {
  return apiRetry(() =>
    axios
      .get<Patient>(`${apiBaseUrl}/patients/${id}`)
      .then((res) => res.data)
  );
};

const create = async (object: PatientFormValues) => {
  try {
    const response = await apiRetry(() =>
      axios.post<Patient>(`${apiBaseUrl}/patients`, object)
    );

    return response.data;
  } catch (error) {
    console.error('Patient creation failed: ', error);
    throw error;
  }
};

const createNewEntry = async (
  id: string,
  object: NewEntryFormValues
) => {
  return apiRetry(() =>
    axios
      .post<Entry>(`${apiBaseUrl}/patients/${id}/entries`, object)
      .then((res) => res.data)
  );
};

const getEntriesByPatientId = async (id: string) => {
  return apiRetry(() =>
    axios
      .get<Entry[]>(`${apiBaseUrl}/patients/${id}/entries}`)
      .then((res) => res.data)
  );
};

const updatePatient = async (
  id: string,
  object: PatientFormValues
) => {
  return apiRetry(() =>
    axios
      .put<Patient>(`${apiBaseUrl}/patients/${id}`, object)
      .then((res) => res.data)
  );
};

export default {
  getAll,
  create,
  createNewEntry,
  getById,
  getEntriesByPatientId,
  updatePatient,
};
