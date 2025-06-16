import { Box, Typography, ListItemButton, ListItemText, CircularProgress } from '@mui/material';
import { useEntryVersions } from '../hooks/useEntryVersions';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { EntryVersion } from '@shared/src/types/medicalTypes';

interface VersionListProps {
  entryId: string;
  onVersionSelect?: (versionId: string) => void;
}

const VersionRow = ({ 
  index, 
  style, 
  data 
}: ListChildComponentProps<{
  versions: EntryVersion[];
  onVersionSelect?: (versionId: string) => void;
}>) => {
  const version = data.versions[index];
  return (
    <ListItemButton 
      style={style} 
      onClick={() => data.onVersionSelect?.(version.id)}
      component="div"
    >
      <ListItemText
        primary={version.updatedAt ? new Date(version.updatedAt).toLocaleString() : 'Unknown date'}
        secondary={version.changeReason || 'No change reason provided'}
      />
    </ListItemButton>
  );
};

const VersionList = ({ entryId, onVersionSelect }: VersionListProps) => {
  const { versions, loading, error } = useEntryVersions(entryId);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error.message}</Typography>;
  if (!versions.length) return <Typography>No versions available</Typography>;

  return (
    <Box height={400}>
      <AutoSizer>
        {({ height, width }) => (
          <FixedSizeList
            height={height}
            width={width}
            itemSize={72}
            itemCount={versions.length}
            itemData={{ versions, onVersionSelect }}
          >
            {VersionRow}
          </FixedSizeList>
        )}
      </AutoSizer>
    </Box>
  );
};

export default VersionList;