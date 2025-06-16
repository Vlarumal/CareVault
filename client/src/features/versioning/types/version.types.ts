import { EntryVersion } from '@shared/src/types/medicalTypes';

export interface VersionListProps {
  entryId: string;
  onVersionSelect?: (versionId: string) => void;
}

export interface VersionDiffViewerProps {
  entryId: string;
  versionId1: string;
  versionId2: string;
}

export interface VersionSelectorProps {
  versions: EntryVersion[];
  selectedVersionId?: string;
  onSelect: (versionId: string) => void;
  disabled?: boolean;
}