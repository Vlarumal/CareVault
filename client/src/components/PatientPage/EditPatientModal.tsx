import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PatientForm from '../AddPatientModal/PatientForm';
import patientService from '../../services/patients';
import { Patient, PatientFormValues } from '../../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ErrorBoundary from '../ErrorBoundary';
import { useNotification } from '../../services/notificationService';

interface Props {
  patient: Patient;
  open: boolean;
  onClose: () => void;
}

const EditPatientModal = ({ patient, open, onClose }: Props) => {
  const queryClient = useQueryClient();

  const { showNotification } = useNotification();
  const updatePatientMutation = useMutation({
    mutationFn: (values: PatientFormValues) => {
      return patientService.updatePatient(patient.id, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['patient', patient.id],
      });
      showNotification('Patient updated successfully', 'success');
      onClose();
    },
    onError: (error: Error) => {
      showNotification(
        `Failed to update patient: ${error.message}`,
        'error'
      );
      updatePatientMutation.reset();
    },
  });

  const handleSubmit = (values: PatientFormValues) => {
    updatePatientMutation.mutate(values);
  };

  return (
    <ErrorBoundary>
      <Dialog
        open={open}
        onClose={(_, reason) => {
          if (reason !== 'backdropClick') {
            onClose();
          }
        }}
        fullWidth
        maxWidth='sm'
        aria-labelledby='edit-patient-dialog-title'
        aria-describedby='edit-patient-form'
        sx={{
          '& .MuiDialog-paper': {
            overflow: 'visible',
            '& .MuiDialogContent-root': {
              pt: 0,
              pb: 2,
            },
          },
          '& .MuiDialogTitle-root + .MuiDialogContent-root': {
            pt: 0,
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 1.5,
            mb: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
          id='edit-patient-dialog-title'
        >
          <EditIcon
            fontSize='small'
            sx={{ mt: 0.5 }}
          />
          Edit Patient
        </DialogTitle>
        <DialogContent>
          <Box
            component='section'
            aria-live='polite'
            sx={{
              pt: 1,
              '& .MuiTextField-root': {
                mb: 2,
              },
            }}
          >
            <PatientForm
              onSubmit={handleSubmit}
              onCancel={onClose}
              isEdit={true}
              initialValues={{
                name: patient.name,
                occupation: patient.occupation,
                gender: patient.gender,
                ssn: patient.ssn || '',
                dateOfBirth:
                  (
                    patient.date_of_birth || patient.dateOfBirth
                  )?.split('T')[0] || '',
                deathDate:
                  (
                    patient.death_date || patient.deathDate
                  )?.split('T')[0] || '',
              }}
              loading={updatePatientMutation.isPending}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
};

export default EditPatientModal;
