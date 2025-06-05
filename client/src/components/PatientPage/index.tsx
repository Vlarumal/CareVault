import { useParams } from 'react-router-dom';
import { DiagnosisEntry, HealthCheckEntry, Patient } from '../../types';
import { getIcon } from '../../utils';
import patientService from '../../services/patients';
import diagnosisService from '../../services/diagnoses';
import { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import AddEntryForm from './AddEntryForm';
import HealthRatingBar from '../HealthRatingBar';
import TimelineView from './TimelineView';

const PatientPage = () => {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [diagnoses, setDiagnoses] = useState<DiagnosisEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null
  );

  // Move getData outside useEffect so it can be reused
  const getData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setErrorMessage(null); // Reset error when retrying
      const [patientData, diagnosesData] = await Promise.all([
        patientService.getById(id),
        diagnosisService.getAllDiagnoses(),
      ]);
      setPatient(patientData);
      setDiagnoses(diagnosesData);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to load data'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [id]);

  const getDiagnosisByCode = (code: string): string => {
    if (!diagnoses) return 'No diagnoses';

    const diagnosis = diagnoses.find((d) => d.code === code);

    return diagnosis ? diagnosis.name : 'Unknown diagnosis';
  };

  const diagnosisCodesAll = diagnoses.map((d) => d.code);

  if (loading)
    return (
      <Box
        display='flex'
        justifyContent='center'
        data-testid='loading-spinner'
      >
        <CircularProgress />
      </Box>
    );

  if (errorMessage)
    return (
      <div>
        <Alert severity='error'>{errorMessage}</Alert>
        <button 
          onClick={getData}
          style={{ marginTop: '10px' }}
        >
          Retry
        </button>
      </div>
    );

  if (!patient)
    return <Alert severity='warning'>No patient found</Alert>;
    
  // Get latest health rating from entries
  const getLatestHealthRating = (): number | null => {
    if (!patient.entries) return null;
    
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
          setPatient={setPatient}
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
