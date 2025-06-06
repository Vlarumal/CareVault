import { useParams } from 'react-router-dom';
import { DiagnosisEntry, HealthCheckEntry, NewEntryFormValues, Patient } from '../../types';
import { getIcon } from '../../utils';
import patientService from '../../services/patients';
import diagnosisService from '../../services/diagnoses';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Box, Button } from '@mui/material';
import AddEntryForm from './AddEntryForm';
import HealthRatingBar from '../HealthRatingBar';
import TimelineView from './TimelineView';

const PatientPage = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: patient, isLoading, isError, error, refetch } = useQuery<Patient, Error>({
    queryKey: ['patient', id],
    queryFn: () => patientService.getById(id!),
    enabled: !!id,
  });

  const { data: diagnoses } = useQuery<DiagnosisEntry[], Error>({
    queryKey: ['diagnoses'],
    queryFn: diagnosisService.getAllDiagnoses,
  });

  const mutation = useMutation({
    mutationFn: (object: NewEntryFormValues) =>
      patientService.createNewEntry(id!, object),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
    }
  });

  const getDiagnosisByCode = (code: string): string => {
    if (!diagnoses) return 'No diagnoses';

    const diagnosis = diagnoses.find((d) => d.code === code);

    return diagnosis ? diagnosis.name : 'Unknown diagnosis';
  };

  const diagnosisCodesAll = diagnoses?.map((d) => d.code) || [];

  // Get latest health rating from entries
  const getLatestHealthRating = (): number | null => {
    if (!patient?.entries) return null;
    
    const healthCheckEntries = patient.entries.filter(
      entry => entry.type === 'HealthCheck'
    ) as HealthCheckEntry[];
    
    if (healthCheckEntries.length === 0) return null;
    
    const sortedEntries = [...healthCheckEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    return sortedEntries[0].healthCheckRating;
  };
  
  const latestHealthRating = getLatestHealthRating();

  if (isLoading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        data-testid='loading-spinner'
      >
        <div>Loading...</div>
      </Box>
    );
  }

  if (isError) {
    return (
      <div>
        <Alert severity='error'>{error?.message || 'Failed to load patient data'}</Alert>
        <Button
          variant="contained"
          onClick={() => refetch()}
          style={{ marginTop: '10px' }}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!patient) {
    return <Alert severity='warning'>No patient found</Alert>;
  }

  return (
    <div>
      <h2 data-testid="patient-name">
        {patient.name} {getIcon(patient.gender)}
      </h2>
      <div>ssn: {patient.ssn}</div>
      <div>occupation: {patient.occupation}</div>
      <div style={{ margin: '10px 0' }}>
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
          <h2>entries</h2>
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
