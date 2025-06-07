import { useQuery } from '@tanstack/react-query';
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  CssBaseline,
  Alert,
  Box,
  LinearProgress,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

import { Patient } from './types';

import patientService from './services/patients';
import PatientListPage from './components/PatientListPage';
import PatientPage from './components/PatientPage';

const App = () => {
  const {
    isLoading,
    isError,
    error
  } = useQuery<Patient[], Error>({
    queryKey: ['patients'],
    queryFn: patientService.getAll,
    staleTime: 300000, // 5 minutes
  });

  return (
    <div className='App'>
      <CssBaseline />
      <Router>
        <AppBar position="static" color="primary" aria-label="CareVault navigation">
                  <Toolbar>
                    <HomeIcon sx={{ mr: 1 }} aria-label="Home" />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                      CareVault
                    </Typography>
                  </Toolbar>
                </AppBar>
        
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          {isLoading ? (
            <Box sx={{ width: '100%', mt: 4 }}>
                          <LinearProgress aria-label="Loading patients" />
                        </Box>
          ) : isError ? (
            <Alert severity="error" aria-label="Error fetching patients">
                          {error?.message || 'Failed to fetch patients'}
                        </Alert>
          ) : (
            <Routes>
              <Route
                path='/'
                element={
                  <PatientListPage />
                }
              />
              <Route
                path='/:id'
                element={<PatientPage />}
              />
            </Routes>
          )}
        </Container>
      </Router>
    </div>
  );
};

export default App;
