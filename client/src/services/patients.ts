import qs from 'qs';
import {
  Entry,
  NewEntryFormValues,
  Patient,
  PatientFormValues,
} from '../types';
import { api, apiRetry } from '../utils/apiUtils';
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
    api.get(`/patients`, { params })
  );

  return response.data as PaginatedResponse<Patient[]>;
};

const getById = async (id: string) => {
  return apiRetry(() =>
    api
      .get<Patient>(`/patients/${id}`)
      .then((res) => res.data)
  );
};

const create = async (object: PatientFormValues) => {
  try {
    const response = await apiRetry(() =>
      api.post<Patient>(`/patients`, object)
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
    api
      .post<Entry>(`/patients/${id}/entries`, object)
      .then((res) => res.data)
  );
};

const getEntriesByPatientId = async (id: string) => {
  return apiRetry(() =>
    api
      .get<Entry[]>(`/patients/${id}/entries`)
      .then((res) => res.data)
  );
};

const updatePatient = async (
  id: string,
  object: PatientFormValues
) => {
  return apiRetry(() =>
    api
      .put<Patient>(`/patients/${id}`, object)
      .then((res) => res.data)
  );
};

const updateEntry = async (
  patientId: string,
  entryId: string,
  values: NewEntryFormValues & { lastUpdated?: string; changeReason?: string }
) => {
  return apiRetry(() =>
    api
      .put<Entry>(
        `/patients/${patientId}/entries/${entryId}`,
        values
      )
      .then((res) => res.data)
  );
};

const deletePatient = async (id: string, deletedBy: string, reason?: string) => {
  return apiRetry(() =>
    api.delete(`/patients/${id}`, {
      data: { deletedBy, reason }
    })
  );
};

export default {
  getAll,
  create,
  createNewEntry,
  getById,
  getEntriesByPatientId,
  updatePatient,
  updateEntry,
  deletePatient,
};
