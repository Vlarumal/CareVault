import { MenuItem, Select, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import { EntryVersion } from '@shared/src/types/medicalTypes';

interface VersionSelectorProps {
  versions: EntryVersion[];
  selectedVersionId?: string;
  onSelect: (versionId: string) => void;
  disabled?: boolean;
}

const VersionSelector = ({ 
  versions, 
  selectedVersionId, 
  onSelect, 
  disabled 
}: VersionSelectorProps) => {
  const handleChange = (event: SelectChangeEvent) => {
    onSelect(event.target.value);
  };

  return (
    <FormControl fullWidth size="small" disabled={disabled}>
      <InputLabel>Select Version</InputLabel>
      <Select
        value={selectedVersionId || ''}
        onChange={handleChange}
        label="Select Version"
      >
        {versions.map(version => (
          <MenuItem key={version.id} value={version.id}>
            {version.updatedAt ? new Date(version.updatedAt).toLocaleString() : 'Unknown date'}
            {version.changeReason && ` - ${version.changeReason}`}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default VersionSelector;