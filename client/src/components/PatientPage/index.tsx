import { useParams, useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import EditPatientModal from './EditPatientModal';
import { mergeEntryUpdates } from '../../utils/entryUtils';
import {
  DiagnosisEntry,
  NewEntryFormValues,
  Patient,
  AnyEntry,
} from '../../types';
import { getIcon } from '../../utils';
import DeletePatientButton from '../DeletePatientButton';

// Debug logging
if (process.env.NODE_ENV === 'development') {
  console.log('PatientPage component loaded');
}
import patientService from '../../services/patients';
import diagnosisService from '../../services/diagnoses';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { Alert, Box, Button, Fab, Typography } from '@mui/material';
import { useNotification } from '../../services/notificationService';
import AddEntryDrawer from './AddEntryDrawer';
import HealthRatingBar from '../HealthRatingBar';
import TimelineView from './TimelineView';
import PatientDetailsSkeleton from './PatientDetailsSkeleton';
import { getLatestHealthRating } from '../../services/healthRatingService';
import { createDeduplicatedQuery } from '../../utils/apiUtils';
import AddIcon from '@mui/icons-material/Add';
import EntryHistoryModal from './EntryHistoryModal';
import EntryForm from './EntryForm';
import { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';


const PatientPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const validatedId = id || '';

  const {
    data: patient,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Patient, Error>({
    queryKey: ['patient', validatedId],
    queryFn: () => {
      if (!validatedId) {
        throw new Error('Patient ID is required');
      }
      return patientService.getById(validatedId);
    },
    enabled: !!validatedId,
  });

  // Use deduplicated query for diagnoses
  const { data: diagnoses } = useQuery<DiagnosisEntry[], Error>({
    queryKey: ['diagnoses'],
    queryFn: createDeduplicatedQuery(
      ['diagnoses'],
      diagnosisService.getAllDiagnoses
    ),
  });

  const { showNotification } = useNotification();

  const updateMutation = useMutation({
    mutationFn: ({
      entryId,
      values,
    }: {
      entryId: string;
      values: NewEntryFormValues & { updatedAt: string };
    }) => {
      if (!validatedId) {
        throw new Error('Patient ID is required');
      }
      return patientService.updateEntry(validatedId, entryId, values);
    },
    onMutate: async ({ entryId, values }) => {
      await queryClient.cancelQueries({
        queryKey: ['patient', validatedId],
        exact: true,
      });

      const previousPatient = queryClient.getQueryData<Patient>([
        'patient',
        validatedId,
      ]);

      if (previousPatient) {
        const updatedEntries = previousPatient.entries?.map(
          (entry) => {
            if (entry.id.startsWith('temp-')) return entry;
            
            if (entry.id === entryId) {
              if (!entry) return entry;
              return mergeEntryUpdates(entry, values);
            }
            return entry;
          }
        );

        queryClient.setQueryData<Patient>(['patient', validatedId], {
          ...previousPatient,
          entries: updatedEntries,
        });
      }

      return { previousPatient };
    },
    onSuccess: (updatedEntry) => {
      handleDrawerClose();
      setEditingEntry(null);
      showNotification('Entry updated successfully!', 'success');
      
      queryClient.setQueryData<Patient>(['patient', validatedId], (old) => {
        if (!old) return old;
        return {
          ...old,
          entries: old.entries?.map(entry =>
            entry.id === updatedEntry.id ? updatedEntry : entry
          )
        };
      });
      console.log('Invalidating patients list query');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
    onError: (error, _variables, context) => {
      if (context?.previousPatient) {
        queryClient.setQueryData<Patient>(
          ['patient', validatedId],
          context.previousPatient
        );
      }
      
      let errorMessage = 'Failed to update entry';
      if (error instanceof AxiosError) {
        if (error.response?.status === 409) {
          errorMessage = 'Entry was modified by another user. Please refresh and try again.';
          queryClient.invalidateQueries({ queryKey: ['patient', validatedId], exact: true });
        } else {
          errorMessage = error.response?.data?.error || error.message || errorMessage;
        }
      }
      
      showNotification(errorMessage, 'error');
    },
  });

  const addMutation = useMutation({
    mutationFn: (object: NewEntryFormValues) => {
      if (!validatedId) {
        throw new Error('Patient ID is required');
      }
      if (
        !object.type ||
        !object.description ||
        !object.date ||
        !object.specialist
      ) {
        throw new Error('Missing required entry fields');
      }
      const idempotencyKey = uuidv4();
      return patientService.createNewEntry(validatedId, object, idempotencyKey);
    },
    onMutate: async (newEntry) => {
      await queryClient.cancelQueries({
        queryKey: ['patient', validatedId],
        exact: true,
      });

      const previousPatient = queryClient.getQueryData<Patient>([
        'patient',
        validatedId,
      ]);

      if (previousPatient) {
        const tempId = `temp-${Date.now()}`;
        const optimisticEntry = {
          ...newEntry,
          id: tempId,
          isOptimistic: true,
        } as AnyEntry;

        // Update the query cache with optimistic entry
        queryClient.setQueryData<Patient>(['patient', validatedId], {
          ...previousPatient,
          entries: [
            ...(previousPatient.entries || []),
            optimisticEntry,
          ],
        });
      }

      return { previousPatient };
    },
    onError: (err, _newEntry, context) => {
      if (context?.previousPatient) {
        queryClient.setQueryData<Patient>(
          ['patient', validatedId],
          context.previousPatient
        );
      }
      showNotification(
        `Failed to add entry: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`,
        'error'
      );
    },
    onSettled: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await queryClient.invalidateQueries({
        queryKey: ['patient', validatedId],
        exact: true,
      });
      console.log('Invalidating patients list query');
      await queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });

  const getDiagnosisByCode = (code: string): string => {
    if (!diagnoses) return 'No diagnoses';

    const diagnosis = diagnoses.find((d) => d.code === code);

    return diagnosis ? diagnosis.name : 'Unknown diagnosis';
  };

  const diagnosisCodesAll = diagnoses || [];

  const latestHealthRating = patient
    ? getLatestHealthRating(patient.entries || [])
    : null;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEntryHistoryModalOpen, setIsEntryHistoryModalOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<AnyEntry | null>(null);

  const handleEntryClick = useCallback((entryId: string) => {
    setSelectedEntryId(entryId);
    setIsEntryHistoryModalOpen(true);
  }, []);

  const handleEntryHistoryModalClose = useCallback(() => {
    setIsEntryHistoryModalOpen(false);
    setSelectedEntryId(null);
  }, []);

  const handleEditEntry = (entry: AnyEntry) => {
    setEditingEntry(entry);
    setIsDrawerOpen(true);
  };

  const handleDrawerToggle = () => {
    setEditingEntry(null);
    setIsDrawerOpen(true);
    setTimeout(() => {
      const formElement = document.querySelector(
        '.drawer-content form'
      );
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    addMutation.reset();
    updateMutation.reset();
  };

  const handleEntrySuccess = () => {
    handleDrawerClose();
    setEditingEntry(null);
  };

  if (isLoading) {
    return <PatientDetailsSkeleton />;
  }

  if (isError) {
    return (
      <div>
        <Alert
          severity='error'
          role='alert'
          data-testid='error-alert'
          aria-live='polite'
        >
          {error?.message || 'Failed to load patient data'}
        </Alert>
        <Button
          variant='contained'
          onClick={() => refetch()}
          style={{ marginTop: '10px' }}
          data-testid='retry-button'
          aria-label='Retry loading patient data'
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!patient) {
    return (
      <Alert
        severity='warning'
        role='alert'
        data-testid='warning-alert'
      >
        No patient found
      </Alert>
    );
  }

  return (
    <div>
      <Box
        display='flex'
        alignItems='center'
        gap={2}
        marginBottom={2}
      >
        <h2 data-testid='patient-name'>
          {patient.name}
          {patient.deathDate && (
            <span aria-label="Deceased" role="img" style={{ marginLeft: '8px' }}>
              ☠️
            </span>
          )}
          <span
            aria-label={`Gender: ${patient.gender}`}
            role='img'
            style={{ marginLeft: '8px' }}
          >
            {getIcon(patient.gender)}
          </span>
        </h2>
        <Button
          variant='contained'
          color='primary'
          onClick={() => setIsEditModalOpen(true)}
          aria-label='Edit patient details'
        >
          Edit
        </Button>
        <DeletePatientButton
          patientId={patient.id}
          patientName={patient.name}
          onSuccess={() => navigate('/')}
        />
      </Box>
      <Button
        variant='outlined'
        onClick={() => navigate('/')}
        aria-label='Back to patient list'
        style={{ marginBottom: '10px' }}
      >
        Back to Patient List
      </Button>
      <div>SSN: {patient.ssn}</div>
      <div>Occupation: {patient.occupation}</div>
      <div>Date of birth: {patient.date_of_birth?.split('T')[0]}</div>
      {patient.death_date && (
        <div>Date of death: {patient.death_date?.split('T')[0]}</div>
      )}
      <div
        style={{ margin: '10px 0' }}
        aria-label='Latest health rating'
      >
        Latest Health Rating:
        <HealthRatingBar
          rating={latestHealthRating}
          showText={true}
        />
      </div>
      <Button
        variant='contained'
        color='primary'
        startIcon={<AddIcon />}
        onClick={handleDrawerToggle}
        aria-label='Add new entry'
        style={{
          position: 'sticky',
          top: '10px',
          zIndex: 1,
          margin: '10px 0',
        }}
      >
        Add New Entry
      </Button>
      <Typography
        variant='body2'
        color='textSecondary'
        style={{ marginBottom: '10px' }}
      >
        Add new medical entries here
      </Typography>

      <section>
        <Fab
          color='primary'
          aria-label='add'
          onClick={handleDrawerToggle}
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            animation: 'pulse 2s infinite',
            zIndex: 1200,
            display: isDrawerOpen ? 'none' : 'inline-flex',
          }}
        >
          <AddIcon />
        </Fab>
        <AddEntryDrawer
          isOpen={isDrawerOpen}
          onClose={handleDrawerClose}
          title={editingEntry ? 'Edit Entry' : 'Add New Entry'}
        >
          <EntryForm
            key={editingEntry ? `edit-${editingEntry.id}` : 'add-new'}
            patientId={validatedId}
            onSubmit={async (values) => {
              try {
                if (editingEntry) {
                  if (!editingEntry.updatedAt) {
                    console.error('Entry updatedAt missing, cannot update');
                    showNotification('Entry updatedAt missing, cannot update', 'error');
                    return;
                  }
                  
                  await updateMutation.mutateAsync(
                    {
                      entryId: editingEntry.id,
                      values: {
                        ...values,
                        updatedAt: new Date().toISOString(),
                      },
                    }
                  );
                  handleEntrySuccess();
                } else {
                  await addMutation.mutateAsync(values);
                  handleEntrySuccess();
                }
              } catch (error) {
                // Errors are already handled by the mutation's onError callback
                // We don't need to do anything here as the error state will update
              }
            }}
            error={
              editingEntry
                ? updateMutation.error?.message
                : addMutation.error?.message
            }
            loading={
              editingEntry
                ? updateMutation.isPending
                : addMutation.isPending
            }
            diagnosisCodesAll={diagnosisCodesAll}
            onCancel={() => {
              handleDrawerClose();
              setEditingEntry(null);
            }}
            isEditMode={!!editingEntry}
            existingEntry={editingEntry || undefined}
          />
        </AddEntryDrawer>
      </section>

      {selectedEntryId && (
        <EntryHistoryModal
          open={isEntryHistoryModalOpen}
          onClose={handleEntryHistoryModalClose}
          entryId={selectedEntryId}
          patientId={validatedId}
        />
      )}

      {isEditModalOpen && (
        <EditPatientModal
          patient={patient}
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {patient.entries && patient.entries.length > 0 && (
        <Box>
          <h2 aria-label='Patient entries'>entries</h2>

          <TimelineView
            entries={patient.entries}
            getDiagnosisByCode={getDiagnosisByCode}
            onEntryClick={handleEntryClick}
            onEditEntry={handleEditEntry}
            patientId={validatedId}
            onDeleted={() => {
              handleEntryHistoryModalClose();
              refetch();
            }}
          />
        </Box>
      )}
    </div>
  );
};

export default PatientPage;

