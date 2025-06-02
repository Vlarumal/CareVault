import { useParams } from 'react-router-dom';
import { DiagnosisEntry, Patient } from '../../types';
import { getIcon } from '../../utils';
import patientService from '../../services/patients';
import diagnosisService from '../../services/diagnoses';
import { useEffect, useState } from 'react';
import { Alert, Box, Card, CircularProgress } from '@mui/material';
import EntryDetails from './EntryDetails';
import AddEntryForm from './AddEntryForm';

const PatientPage = () => {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [diagnoses, setDiagnoses] = useState<DiagnosisEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null
  );

  useEffect(() => {
    const getData = async () => {
      if (!id) return;

      try {
        setLoading(true);
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
      >
        <CircularProgress />
      </Box>
    );

  if (errorMessage)
    return <Alert severity='error'>{errorMessage}</Alert>;

  if (!patient)
    return <Alert severity='warning'>No patient found</Alert>;

  return (
    <div>
      <h2>
        {patient.name} {getIcon(patient.gender)}
      </h2>
      <div>ssn: {patient.ssn}</div>
      <div>occupation: {patient.occupation}</div>

      <section>
        <AddEntryForm
          setPatient={setPatient}
          diagnosisCodesAll={diagnosisCodesAll}
        />
      </section>

      {patient.entries && patient.entries.length > 0 && (
        <Box>
          <h2>entries</h2>
          {patient.entries.map((entry) => (
            <Box
              mb={1}
              key={entry.id}
            >
              <Card
                variant='outlined'
                sx={{
                  mb: 1,
                  borderColor: 'black',
                  p: 1,
                }}
              >
                <EntryDetails entry={entry} />
              </Card>

              {entry.diagnosisCodes && (
                <Box
                  ml={2}
                  mb={1}
                >
                  <fieldset style={{}}>
                    <legend>Diagnoses</legend>
                    <ul>
                      {entry.diagnosisCodes.map((code: string) => (
                        <li key={code}>
                          {code} {getDiagnosisByCode(code)}
                        </li>
                      ))}
                    </ul>
                  </fieldset>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}
    </div>
  );
};

export default PatientPage;
