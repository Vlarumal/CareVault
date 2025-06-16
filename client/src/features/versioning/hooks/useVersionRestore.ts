import { useState, useCallback } from 'react';
import { Entry } from '../../../types';
import entryVersionsService from '../../../services/entryVersions';

export const useVersionRestore = () => {
  const [restoredEntry, setRestoredEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState(false);

  const restoreVersion = useCallback(
    async (patientId: string, entryId: string, versionId: string) => {
      try {
        setLoading(true);
        setSuccess(false);
        const entry = await entryVersionsService.restoreVersion(patientId, entryId, versionId);
        setRestoredEntry(entry);
        setError(null);
        setSuccess(true);
      } catch (err) {
        setRestoredEntry(null);
        setSuccess(false);
        setError(err instanceof Error ? err : new Error('Failed to restore version'));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { restoredEntry, loading, error, success, restoreVersion };
};