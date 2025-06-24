import { useState, useEffect } from 'react';
import ErrorBoundary from '../ErrorBoundary';
import { Modal, Box, Typography, Stack, Button, Alert, Tabs, Tab } from '@mui/material';

import { useEntryVersions } from '../../features/versioning/hooks/useEntryVersions';
import { useVersionRestore } from '../../features/versioning/hooks/useVersionRestore';
import VersionPreview from '../../features/versioning/components/VersionPreview';
import VersionList from '../../features/versioning/components/VersionList';
import RestoreIcon from '@mui/icons-material/Restore';

interface EntryHistoryModalProps {
  open: boolean;
  onClose: () => void;
  entryId: string;
  patientId: string;
}

const EntryHistoryModal = ({ open, onClose, entryId, patientId }: EntryHistoryModalProps) => {
  const [selectedVersion, setSelectedVersion] = useState<string>();
  const [activeTab] = useState(0);
  
  const { versions, error, refresh } = useEntryVersions(patientId, entryId);
  
  useEffect(() => {
    if (!open) {
      setSelectedVersion(undefined);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      refresh();
    }
  }, [open, refresh]);
  
  const { loading: restoreLoading, error: restoreError, restoreVersion } = useVersionRestore();

  const handleVersionSelect = (versionId: string) => {
    setSelectedVersion(versionId);
  };

  const handleRestore = async (versionId: string) => {
    if (!window.confirm('Are you sure you want to restore this version?')) return;
    
    await restoreVersion(patientId, entryId, versionId);
    onClose();
    refresh();
  };

  const selectedVersionData = versions?.find(v => v.id === selectedVersion);

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80%',
        maxWidth: 1000,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Entry Version History
        </Typography>

        {error && <Alert severity="error">{error.message}</Alert>}
        {restoreError && <Alert severity="error">{restoreError.message}</Alert>}

        <Stack spacing={3} sx={{ flex: 1, overflow: 'hidden' }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2,
            height: '100%'
          }}>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="subtitle2" gutterBottom>
                Version History
              </Typography>
              <Box sx={{ height: 'calc(100% - 36px)' }}>
                <VersionList
                  patientId={patientId}
                  entryId={entryId}
                  onVersionSelect={handleVersionSelect}
                />
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Version Comparison
              </Typography>
              {selectedVersion && (
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<RestoreIcon />}
                  onClick={() => handleRestore(selectedVersion)}
                  disabled={restoreLoading}
                  sx={{ mb: 2 }}
                >
                  Restore This Version
                </Button>
              )}
              
              <Tabs value={activeTab} sx={{ mb: 2 }}>
                <Tab label="Preview" />
              </Tabs>
              
              {/* Preview tab content */}
              {selectedVersionData ? (
                <ErrorBoundary>
                  <VersionPreview
                    entry={selectedVersionData.entryData}
                    patientId={patientId}
                    onLoad={() => {}}
                  />
                </ErrorBoundary>
              ) : (
                <Typography variant="body2">Select a version to preview</Typography>
              )}
            </Box>
          </Box>
        </Stack>
      </Box>
    </Modal>
  );
};

export default EntryHistoryModal;