import { Entry } from '../types';
import type { EntryVersion, VersionDiff } from '@shared/src/types/medicalTypes';
import { api } from '../utils/apiUtils';
import { isAxiosError } from 'axios';
  
const getEntryVersions = async (patientId: string, entryId: string): Promise<EntryVersion[]> => {
  try {
    const { data } = await api.get<EntryVersion[]>(
      `/patients/${patientId}/entries/${entryId}/versions`
    );
    return data;
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      if (error.response === undefined) {
        throw new Error('Network error: Failed to fetch entry versions. Possible CORS issue.');
      }
      if (error.response.data?.code === 'NO_VERSIONS') {
        throw new Error('NO_VERSIONS');
      }
    }
    throw error;
  }
};
  
const getVersionDiff = async (
  patientId: string,
  entryId: string,
  versionId1: string,
  versionId2: string
): Promise<{ diff: VersionDiff }> => {
  try {
    const { data } = await api.get<{ diff: VersionDiff }>(
      `/patients/${patientId}/entries/${entryId}/versions/diff`,
      { params: { version1: versionId1, version2: versionId2 } }
    );
    return data;
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response === undefined) {
      throw new Error('Network error: Failed to fetch version diff. Possible CORS issue.');
    }
    throw error;
  }
};
  
const createVersion = async (
  patientId: string,
  entryId: string,
  editorId: string,
  changeReason: string
): Promise<EntryVersion> => {
  try {
    const { data } = await api.post<EntryVersion>(
      `/patients/${patientId}/entries/${entryId}/versions`,
      { editorId, changeReason }
    );
    return data;
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response === undefined) {
      throw new Error('Network error: Failed to create version. Possible CORS issue.');
    }
    throw error;
  }
};
  
const restoreVersion = async (
  patientId: string,
  entryId: string,
  versionId: string
): Promise<Entry> => {
  try {
    const { data } = await api.put<Entry>(
      `/patients/${patientId}/entries/${entryId}/versions/${versionId}/restore`,
      {},
      { withCredentials: true }
    );
    return data;
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response === undefined) {
      throw new Error('Network error: Failed to restore version. Possible CORS issue.');
    }
    throw error;
  }
};
  
const getLatestVersion = async (patientId: string, entryId: string): Promise<EntryVersion> => {
  try {
    const { data } = await api.get<EntryVersion>(
      `/patients/${patientId}/entries/${entryId}/versions/latest`
    );
    if (!data.updatedAt) {
      throw new Error('Server returned version without updatedAt timestamp');
    }
    return data;
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response === undefined) {
      throw new Error('Network error: Failed to fetch latest version. Possible CORS issue.');
    }
    throw error;
  }
};
  
const getLatestVersionId = async (patientId: string, entryId: string): Promise<string> => {
  const version = await getLatestVersion(patientId, entryId);
  return version.id;
};
  
export default {
  getEntryVersions,
  getVersionDiff,
  createVersion,
  restoreVersion,
  getLatestVersion,
  getLatestVersionId,
};