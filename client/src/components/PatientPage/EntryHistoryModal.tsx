import { useState, useEffect } from 'react';
import ErrorBoundary from '../ErrorBoundary';
import { Modal, Box, Typography, Stack, Button, CircularProgress, Alert, Tabs, Tab } from '@mui/material';
import { useEntryVersions } from '../../features/versioning/hooks/useEntryVersions';
import { useVersionDiff } from '../../features/versioning/hooks/useVersionDiff';
import { useVersionRestore } from '../../features/versioning/hooks/useVersionRestore';
import VersionDiffViewer from '../../features/versioning/components/VersionDiffViewer';
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
  const [activeTab, setActiveTab] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  const { versions, error, refresh } = useEntryVersions(patientId, entryId);
  
  useEffect(() => {
    if (!open) {
      setSelectedVersion(undefined);
      setActiveTab(0);
      setPreviewLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      refresh();
    }
  }, [open, refresh]);
  
  const { diff, loading: diffLoading, error: diffError, fetchDiff } = useVersionDiff();
  const { loading: restoreLoading, error: restoreError, restoreVersion } = useVersionRestore();

  const handleVersionSelect = (versionId: string) => {
    setSelectedVersion(versionId);
    fetchDiff(patientId, entryId, versionId, 'current');
    setActiveTab(0); // Switch to Diff tab when selecting a new version
    setPreviewLoading(true); // Reset preview loading state
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
              
              <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
                <Tab label="Diff" />
                <Tab label="Preview" />
              </Tabs>
              
              {activeTab === 0 ? (
                // Diff tab
                <>
                  {diffLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                      <CircularProgress />
                      <Typography variant="body2" ml={2}>Loading diff...</Typography>
                    </Box>
                  ) : diffError ? (
                    <Alert severity="error">{diffError.message}</Alert>
                  ) : diff ? (
                    <ErrorBoundary>
                      <Box sx={{ minHeight: 300 }}>
                        <VersionDiffViewer diff={diff} />
                      </Box>
                    </ErrorBoundary>
                  ) : (
                    <Typography variant="body2">Select a version to view the diff</Typography>
                  )}
                </>
              ) : (
                // Preview tab
                <>
                  {previewLoading && (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                      <CircularProgress />
                    </Box>
                  )}
                  {selectedVersionData ? (
                    <ErrorBoundary>
                      <VersionPreview
                        entry={selectedVersionData.entryData}
                        patientId={patientId}
                        onLoad={() => setPreviewLoading(false)}
                      />
                    </ErrorBoundary>
                  ) : (
                    <Typography variant="body2">Select a version to preview</Typography>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Stack>
      </Box>
    </Modal>
  );
};

export default EntryHistoryModal;