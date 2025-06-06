import { Dialog, DialogTitle, DialogContent, Divider, Alert, CircularProgress, Box } from '@mui/material';

import AddPatientForm from "./AddPatientForm";
import { PatientFormValues } from "../../types";

interface Props {
  modalOpen: boolean;
  onClose: () => void;
  onSubmit: (values: PatientFormValues) => void;
  error?: string;
  loading?: boolean;
}

const AddPatientModal = ({ modalOpen, onClose, onSubmit, error, loading }: Props) => (
  <Dialog fullWidth={true} open={modalOpen} onClose={() => onClose()}>
    <DialogTitle>Add a new patient</DialogTitle>
    <Divider />
    <DialogContent>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <AddPatientForm onSubmit={onSubmit} onCancel={onClose} />
      )}
    </DialogContent>
  </Dialog>
);

export default AddPatientModal;
