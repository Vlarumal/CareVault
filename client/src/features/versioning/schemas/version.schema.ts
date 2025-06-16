import { z } from 'zod';

export const versionRestoreSchema = z.object({
  entryId: z.string().uuid(),
  versionId: z.string().uuid(),
  changeReason: z.string().min(5).max(200),
});

export const versionDiffSchema = z.object({
  entryId: z.string().uuid(),
  versionId1: z.string().uuid(),
  versionId2: z.string().uuid(),
});

export type VersionRestoreInput = z.infer<typeof versionRestoreSchema>;
export type VersionDiffInput = z.infer<typeof versionDiffSchema>;