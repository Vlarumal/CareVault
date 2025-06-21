import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import patients from '../services/patients';
import { useTranslation } from 'react-i18next';

interface DeleteEntryButtonProps {
  patientId: string;
  entryId: string;
  entryTitle: string;
  onDeleteSuccess: () => void;
}

const DeleteEntryButton: React.FC<DeleteEntryButtonProps> = ({
  patientId,
  entryId,
  entryTitle,
  onDeleteSuccess,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  const isAdmin = user?.role === 'admin';

  const handleDialogOpen = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    setOpen(true);
  };

  const handleDialogClose = () => {
    setOpen(false);
    setDeleteReason('');
    setError(null);
  };

  const handleEntryDelete = async () => {
    if (!user || !deleteReason.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await patients.deleteEntry(
        patientId,
        entryId,
        user.id,
        deleteReason.trim()
      );

      if (response.status >= 200 && response.status < 300) {
        if (typeof onDeleteSuccess === 'function') {
          onDeleteSuccess();
        }
        handleDialogClose();
      } else {
        throw new Error(
          `Delete failed with status ${response.status}`
        );
      }
    } catch (err) {
      setError(t('deleteEntryButton.error'));
      console.error('Failed to delete entry:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <>
      <Button
        variant='contained'
        color='error'
        onClick={handleDialogOpen}
        aria-label={t('deleteEntryButton.ariaLabel', {
          description: entryTitle,
        })}
        sx={{ ml: 1 }}
      >
        {t('deleteEntryButton.label')}
      </Button>

      <Dialog
        open={open}
        onClose={handleDialogClose}
        fullWidth
        maxWidth='sm'
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle>
          {t('deleteEntryButton.confirmTitle')}
        </DialogTitle>

        <DialogContent>
          <DialogContentText gutterBottom>
            {t('deleteEntryButton.confirmMessage', {
              description: entryTitle,
            })}
          </DialogContentText>

          <TextField
            label={t('deleteEntryButton.reasonLabel')}
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            fullWidth
            required
            margin='normal'
            error={!deleteReason.trim()}
            helperText={
              !deleteReason.trim()
                ? t('deleteEntryButton.reasonRequired')
                : ''
            }
          />

          {error && (
            <DialogContentText color='error'>
              {error}
            </DialogContentText>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleDialogClose}
            color='primary'
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleEntryDelete}
            color='error'
            disabled={loading || !deleteReason.trim()}
            startIcon={
              loading ? <CircularProgress size={20} /> : null
            }
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeleteEntryButton;
