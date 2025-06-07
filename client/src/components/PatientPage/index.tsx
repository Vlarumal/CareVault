import { useParams, useNavigate } from 'react-router-dom';
import {
  DiagnosisEntry,
  NewEntryFormValues,
  Patient,
  Entry
} from '../../types';
import { getIcon } from '../../utils';
import patientService from '../../services/patients';
import diagnosisService from '../../services/diagnoses';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Box, Button } from '@mui/material';
import AddEntryForm from './AddEntryForm';
import HealthRatingBar from '../HealthRatingBar';
import TimelineView from './TimelineView';
import PatientDetailsSkeleton from './PatientDetailsSkeleton';
import { getLatestHealthRating } from '../../services/healthRatingService';
import { createDeduplicatedQuery } from '../../utils/apiUtils';

const PatientPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Validate patient ID exists before query
  const validatedId = id || '';

  const { data: patient, isLoading, isError, error, refetch } = useQuery<Patient, Error>({
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
    queryFn: createDeduplicatedQuery(['diagnoses'], diagnosisService.getAllDiagnoses),
  });

  const mutation = useMutation({
    mutationFn: (object: NewEntryFormValues) => {
      if (!validatedId) {
        throw new Error('Patient ID is required');
      }
      // Validate entry payload
      if (!object.type || !object.description || !object.date || !object.specialist) {
        throw new Error('Missing required entry fields');
      }
      return patientService.createNewEntry(validatedId, object);
    },
    onMutate: async (newEntry) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['patient', validatedId], exact: true });

      // Snapshot the previous value
      const previousPatient = queryClient.getQueryData<Patient>(['patient', validatedId]);

      if (previousPatient) {
        // Create optimistic entry with temporary ID
        const tempId = `temp-${Date.now()}`;
        const optimisticEntry = {
          ...newEntry,
          id: tempId,
          isOptimistic: true,
        } as Entry;

        // Update the query cache with optimistic entry
        queryClient.setQueryData<Patient>(['patient', validatedId], {
          ...previousPatient,
          entries: [...(previousPatient.entries || []), optimisticEntry]
        });
      }

      return { previousPatient };
    },
    onError: (err, newEntry, context) => {
      // Rollback to previous state on error
      if (context?.previousPatient) {
        queryClient.setQueryData<Patient>(['patient', validatedId], context.previousPatient);
      }
      alert(`Failed to add entry: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['patient', validatedId], exact: true });
    }
  });

  const getDiagnosisByCode = (code: string): string => {
    if (!diagnoses) return 'No diagnoses';

    const diagnosis = diagnoses.find((d) => d.code === code);

    return diagnosis ? diagnosis.name : 'Unknown diagnosis';
  };

  const diagnosisCodesAll = diagnoses?.map((d) => d.code) || [];

  // Use health rating service
  const latestHealthRating = patient ? getLatestHealthRating(patient.entries || []) : null;

  if (isLoading) {
    return <PatientDetailsSkeleton />;
  }

  if (isError) {
    return (
      <div>
        <Alert severity='error' role="alert" data-testid="error-alert" aria-live="polite">
                  {error?.message || 'Failed to load patient data'}
                </Alert>
                <Button
                  variant="contained"
                  onClick={() => refetch()}
                  style={{ marginTop: '10px' }}
                  data-testid="retry-button"
                  aria-label="Retry loading patient data"
                >
                  Retry
                </Button>
      </div>
    );
  }

  if (!patient) {
    return <Alert severity='warning' role="alert" data-testid="warning-alert">No patient found</Alert>;
  }

  return (
    <div>
      <h2 data-testid="patient-name">
        {patient.name}
        <span aria-label={`Gender: ${patient.gender}`} role="img">
          {getIcon(patient.gender)}
        </span>
      </h2>
      <Button
        variant="outlined"
        onClick={() => navigate('/')}
        aria-label="Back to patient list"
        style={{ marginBottom: '10px' }}
      >
        Back to Patient List
      </Button>
      <div>ssn: {patient.ssn}</div>
      <div>occupation: {patient.occupation}</div>
      <div style={{ margin: '10px 0' }} aria-label="Latest health rating">
              Latest Health Rating:
              <HealthRatingBar
                rating={latestHealthRating}
                showText={true}
              />
            </div>

      <section>
        <AddEntryForm
          onAddEntry={mutation.mutate}
          error={mutation.error?.message}
          loading={mutation.isPending}
          diagnosisCodesAll={diagnosisCodesAll}
        />
      </section>

      {patient.entries && patient.entries.length > 0 && (
        <Box>
          <h2 aria-label="Patient entries">entries</h2>
                    <TimelineView
                      entries={patient.entries}
                      getDiagnosisByCode={getDiagnosisByCode}
                    />
        </Box>
      )}
    </div>
  );
};

export default PatientPage;
