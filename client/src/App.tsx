import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BrowserRouter as Router,
  Route,
  Link,
  Routes,
} from 'react-router-dom';
import {
  Button,
  Divider,
  Container,
  Typography,
} from '@mui/material';

import { apiBaseUrl } from './constants';
import { Patient } from './types';

import patientService from './services/patients';
import PatientListPage from './components/PatientListPage';
import PatientPage from './components/PatientPage';

const App = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get<void>(`${apiBaseUrl}/ping`)
      .catch(() => {
        setError('Error connecting to backend');
      });

    const fetchPatientList = async () => {
      const patients = await patientService.getAll();
      setPatients(patients);
    };
    void fetchPatientList();
  }, []);

  return (
    <div className='App'>
      <Router>
        <Container>
          <Typography
            variant='h3'
            style={{ marginBottom: '0.5em' }}
          >
            CareVault
          </Typography>
          <Button
            component={Link}
            to='/'
            variant='contained'
            color='primary'
          >
            Home
          </Button>
          <Divider hidden />
          <Routes>
            <Route
              path='/'
              element={
                <PatientListPage
                  patients={patients}
                  setPatients={setPatients}
                />
              }
            />
            <Route
              path='/:id'
              element={<PatientPage />}
            />
          </Routes>
        </Container>
      </Router>
      {patients.length === 0 && !error && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px',
          fontWeight: 'bold'
        }}>
          No patients found
        </div>
      )}
      {error && (
        <div style={{ 
          position: 'fixed', 
          bottom: 20, 
          right: 20, 
          backgroundColor: 'red', 
          color: 'white', 
          padding: '10px',
          borderRadius: '5px'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default App;
