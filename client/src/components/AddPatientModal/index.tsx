import { Dialog, DialogTitle, DialogContent, Alert, CircularProgress, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import PatientForm from "./PatientForm";
import { PatientFormValues } from "../../types";
import { useState } from 'react';

interface Props {
  modalOpen: boolean;
  onClose: () => void;
  onSubmit: (values: PatientFormValues) => void;
  error?: string;
  loading?: boolean;
}

const AddPatientModal = ({ modalOpen, onClose, onSubmit, error }: Props) => {
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: PatientFormValues) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      setSubmissionError('Failed to save patient. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      fullWidth
      open={modalOpen}
      onClose={onClose}
      aria-labelledby="add-patient-dialog-title"
      aria-describedby="add-patient-form"
      sx={{
        '& .MuiDialog-paper': {
          overflow: 'visible',
          '& .MuiDialogContent-root': {
            pb: 2
          }
        },
        '& .MuiDialogTitle-root + .MuiDialogContent-root': {
          pt: 0
        }
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: 'success.light',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 1.5,
          mb: 1
        }}
        id="add-patient-dialog-title"
      >
        <AddIcon fontSize="small" sx={{ mt: 0.5 }} />
        Add New Patient
      </DialogTitle>
      <DialogContent
        sx={{
          pt: 1,
          '& .MuiTextField-root': {
            mb: 2
          }
        }}
      >
        {error && <Alert severity="error">{error}</Alert>}
        {submissionError && <Alert severity="error">{submissionError}</Alert>}
        {isSubmitting ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            component="section"
            aria-live="polite"
            sx={{ pt: 1 }}
          >
            <PatientForm onSubmit={handleSubmit} onCancel={onClose} />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};


export default AddPatientModal;
