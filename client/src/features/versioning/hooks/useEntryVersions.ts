import { useState, useEffect, useCallback } from 'react';
import { EntryVersion } from '@shared/src/types/medicalTypes';
import entryVersionsService from '../../../services/entryVersions';

export const useEntryVersions = (patientId: string, entryId: string) => {
  const [versions, setVersions] = useState<EntryVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchVersions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await entryVersionsService.getEntryVersions(patientId, entryId);
      setVersions(data);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.message === 'NO_VERSIONS') {
        setVersions([]);
        setError(null);
      } else {
        setError(err instanceof Error ? err : new Error('Failed to fetch versions'));
      }
    } finally {
      setLoading(false);
    }
  }, [patientId, entryId]);

  useEffect(() => {
    if (entryId) {
      fetchVersions();
    }
  }, [entryId, fetchVersions]);

  return { versions, loading, error, refresh: fetchVersions };
};