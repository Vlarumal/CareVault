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
  createTheme,
  ThemeProvider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

import { Patient } from './types';

import patientService from './services/patients';
import PatientListPage from './components/PatientListPage';
import PatientPage from './components/PatientPage';
import { useMemo, useState } from 'react';

const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      ...(darkMode ? {
        background: {
          default: '#121212',
          paper: '#1e1e1e',
        },
        text: {
          primary: '#e0e0e0',
          secondary: '#b0b0b0',
        },
      } : {}),
    },
  }), [darkMode]);

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
    <ThemeProvider theme={theme}>
      <div className='App'>
        <CssBaseline />
        <Router>
          <AppBar position="static" color="primary" aria-label="CareVault navigation">
            <Toolbar>
              <HomeIcon sx={{ mr: 1 }} aria-label="Home" />
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                CareVault
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                    icon={<Brightness7Icon />}
                    checkedIcon={<Brightness4Icon />}
                    aria-label="Toggle dark mode"
                  />
                }
                label={darkMode ? "Dark Mode" : "Light Mode"}
              />
            </Toolbar>
          </AppBar>

          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }} role="main" aria-labelledby="main-content">
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
    </ThemeProvider>
  );
};

export default App;
