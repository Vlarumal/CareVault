import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';
import patients from '../services/patients';
import { useTranslation } from 'react-i18next';

interface DeletePatientButtonProps {
  patientId: string;
  patientName: string;
  onSuccess: () => void;
}

const DeletePatientButton: React.FC<DeletePatientButtonProps> = ({ 
  patientId, 
  patientName,
  onSuccess 
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleDelete = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await patients.deletePatient(patientId, user.id, t('deletionReason.default'));
      onSuccess();
    } catch (err) {
      setError(t('deletePatientButton.error'));
      console.error('Failed to delete patient:', err);
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  if (!isAdmin) return null;

  return (
    <>
      <Button 
        variant="contained" 
        color="error"
        onClick={handleOpen}
        aria-label={t('deletePatientButton.ariaLabel', { name: patientName })}
      >
        {t('deletePatientButton.label')}
      </Button>
      
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {t('deletePatientButton.confirmTitle', { name: patientName })}
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <DialogContentText color="error">
              {error}
            </DialogContentText>
          )}
          <DialogContentText>
            {t('deletePatientButton.confirmMessage', { name: patientName })}
          </DialogContentText>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeletePatientButton;