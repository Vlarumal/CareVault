import qs from 'qs';
import {
  Entry,
  NewEntryFormValues,
  Patient,
  PatientFormValues,
} from '../types';
import { api, apiRetry } from '../utils/apiUtils';
import { toServerFilter } from '../utils/gridFilterConverter';
import axios from 'axios';

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
    api.get<Patient>(`/patients/${id}`).then((res) => res.data)
  );
};

const create = async (object: PatientFormValues) => {
  try {
    const response = await apiRetry(() =>
      api.post<Patient>(`/patients`, {
        ...object,
        deathDate: object.deathDate || null,
      })
    );

    return response.data;
  } catch (error) {
    console.error('Patient creation failed: ', error);
    throw error;
  }
};

const createNewEntry = async (
  patientId: string,
  entryData: NewEntryFormValues,
  idempotencyKey: string
): Promise<Entry> => {
  try {
    const response = await apiRetry(() =>
      api.post<Entry>(
        `/patients/${patientId}/entries`,
        entryData,
        {
          headers: {
            'Idempotency-Key': idempotencyKey
          }
        }
      )
    );
    return response.data;
  } catch (error) {
    console.error('Entry creation failed: ', error);
    throw error;
  }
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
  try {
    const response = await apiRetry(() =>
      api.put<Patient>(`/patients/${id}`, object)
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      const permission = (error.response.data as { missingPermission?: string })?.missingPermission;
      const message = permission
        ? `You don't have permission to update patients. Required permission: ${permission}. Please contact your administrator.`
        : 'You don\'t have permission to update patients. Please contact your administrator.';
      const err = new Error(message);
      err.name = 'PermissionError';
      throw err;
    }
    throw error;
  }
};

const updateEntry = async (
  patientId: string,
  entryId: string,
  values: NewEntryFormValues & {
    updatedAt: string;
    changeReason?: string;
  }
) => {
  const payload = {
    ...values,
    diagnosisCodes: values.diagnosisCodes,
  };
  try {
    const response = await apiRetry(() =>
      api.put<Entry>(
        `/patients/${patientId}/entries/${entryId}`,
        payload
      )
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      const permission = (error.response.data as { missingPermission?: string })?.missingPermission;
      const message = permission
        ? `You don't have permission to update entries. Required permission: ${permission}. Please contact your administrator.`
        : error.response.data?.message || 'You don\'t have permission to update entries. Please contact your administrator.';
      const err = new Error(message);
      err.name = 'PermissionError';
      throw err;
    }
    throw error;
  }
};

const deletePatient = async (
  id: string,
  deletedBy: string,
  reason?: string
) => {
  try {
    await apiRetry(() =>
      api.delete(`/patients/${id}`, {
        data: { deletedBy, reason },
      })
    );
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      const permission = (error.response.data as { missingPermission?: string })?.missingPermission;
      const message = permission
        ? `You don't have permission to delete patients. Required permission: ${permission}. Please contact your administrator.`
        : 'You don\'t have permission to delete patients. Please contact your administrator.';
      const err = new Error(message);
      err.name = 'PermissionError';
      throw err;
    }
    throw error;
  }
};

const deleteEntry = async (
  patientId: string,
  entryId: string,
  deletedBy: string,
  reason?: string
) => {
  try {
    await apiRetry(() =>
      api.delete(`/patients/${patientId}/entries/${entryId}`, {
        data: { deletedBy, reason },
      })
    );
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      const permission = (error.response.data as { missingPermission?: string })?.missingPermission;
      const message = permission
        ? `You don't have permission to delete entries. Required permission: ${permission}. Please contact your administrator.`
        : 'You don\'t have permission to delete entries. Please contact your administrator.';
      const err = new Error(message);
      err.name = 'PermissionError';
      throw err;
    }
    throw error;
  }
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
  deleteEntry,
};
