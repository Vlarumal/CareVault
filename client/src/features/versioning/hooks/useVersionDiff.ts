import { useState, useCallback } from 'react';
import { VersionDiff } from '@shared/src/types/medicalTypes';
import { ConflictMarker, findConflicts } from '@shared/src/utils/diffUtils';
import entryVersionsService from '../../../services/entryVersions';

interface VersionDiffResult {
  diff: VersionDiff;
  conflicts?: ConflictMarker[];
}

export const useVersionDiff = () => {
  const [diffResult, setDiffResult] = useState<VersionDiffResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDiff = useCallback(
    async (
      patientId: string,
      entryId: string,
      versionId1: string,
      versionId2: string,
      baseVersionId?: string
    ) => {
      try {
        setLoading(true);
        const { diff } = await entryVersionsService.getVersionDiff(
          patientId,
          entryId,
          versionId1,
          versionId2
        );
        
        const result: VersionDiffResult = { diff };
        
        if (baseVersionId) {
          const { diff: baseDiff } = await entryVersionsService.getVersionDiff(
            patientId,
            entryId,
            baseVersionId,
            versionId1
          );
          result.conflicts = findConflicts(diff, baseDiff);
        }
        
        setDiffResult(result);
        setError(null);
      } catch (err) {
        setDiffResult(null);
        setError(err instanceof Error ? err : new Error('Failed to fetch diff'));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    diff: diffResult?.diff || null,
    conflicts: diffResult?.conflicts,
    loading,
    error,
    fetchDiff
  };
};