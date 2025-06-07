import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  InputAdornment,
  TextField,
  Paper,
  useTheme,
  Card,
  CardContent,
  CardActionArea,
  Fade,
  Slide,
  Avatar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import Skeleton from '@mui/material/Skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  PatientFormValues,
  Patient,
  HealthCheckEntry,
  Entry,
} from '../../types';
import AddPatientModal from '../AddPatientModal';
import HealthRatingBar from '../HealthRatingBar';
import patientService from '../../services/patients';
import { Link } from 'react-router-dom';

// Helper to get latest health rating from entries
const getLatestHealthRating = (patient: Patient): number | null => {
  if (!patient.entries) return null;

  const healthCheckEntries = patient.entries.filter(
    (entry: Entry): entry is HealthCheckEntry =>
      entry.type === 'HealthCheck'
  );

  if (healthCheckEntries.length === 0) return null;

  const sortedEntries = [...healthCheckEntries].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  return sortedEntries[0].healthCheckRating;
};

const PatientListPage = () => {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  const [searchText, setSearchText] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  const theme = useTheme();
  const queryClient = useQueryClient();

  const { data: patients = [], isLoading } = useQuery<Patient[], Error>({
    queryKey: ['patients'],
    queryFn: patientService.getAll,
    staleTime: 300000, // 5 minutes
  });

  const mutation = useMutation({
    mutationFn: patientService.create,
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  const openModal = (): void => setModalOpen(true);

  const closeModal = (): void => {
    setModalOpen(false);
    setError(undefined);
  };

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  const submitNewPatient = async (values: PatientFormValues) => {
    // Optimistic update with temporary ID
    const tempId = `temp-${Date.now()}`;
    const optimisticPatient: Patient = {
      ...values,
      id: tempId,
      entries: []
    };
    
    // Update cache immediately
    queryClient.setQueryData(['patients'], (oldPatients: Patient[] = []) => [
      ...oldPatients,
      optimisticPatient
    ]);
    
    // Close modal immediately
    setModalOpen(false);
    
    // Send mutation to server
    mutation.mutate(values, {
      onSuccess: (createdPatient) => {
        // Replace optimistic patient with server response
        queryClient.setQueryData(['patients'], (oldPatients: Patient[] = []) =>
          oldPatients.map(p => p.id === tempId ? createdPatient : p)
        );
      },
      onError: () => {
        // Rollback on error
        queryClient.setQueryData(['patients'], (oldPatients: Patient[] = []) =>
          oldPatients.filter(p => p.id !== tempId)
        );
      }
    });
  };

  // Filter patients based on search text
  const filteredPatients = useMemo(() => {
    if (!searchText) return patients;
    const lowerSearch = searchText.toLowerCase();
    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(lowerSearch) ||
        patient.occupation.toLowerCase().includes(lowerSearch) ||
        patient.gender.toLowerCase().includes(lowerSearch)
    );
  }, [patients, searchText]);

  // Get gender icon color
  const getGenderColor = (gender: string) => {
    switch (gender.toLowerCase()) {
      case 'male':
        return theme.palette.primary.main;
      case 'female':
        return theme.palette.secondary.main;
      default:
        return (theme.palette as { tertiary?: { main: string } }).tertiary?.main || theme.palette.primary.main;
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[1],
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: theme.shadows[3]
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MedicalServicesIcon
            sx={{
              fontSize: 40,
              color: theme.palette.primary.main
            }}
          />
          <Typography
            variant='h3'
            component='h1'
            aria-label='Patient list header'
            color='primary'
            sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}
          >
            Patient Directory
          </Typography>
        </Box>
        <Button
          variant='contained'
          onClick={openModal}
          startIcon={<PersonAddIcon />}
          sx={{
            minWidth: 200,
            py: 1.5,
            fontWeight: 600,
            boxShadow: theme.shadows[1],
            '&:hover': {
              boxShadow: theme.shadows[3],
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease'
          }}
          aria-label='Add new patient'
        >
          Add New Patient
        </Button>
      </Box>
      {isLoading || initialLoad ? (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 3.45,
          [theme.breakpoints.up(320)]: {
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
          },
          [theme.breakpoints.up(768)]: {
            gridTemplateColumns: 'repeat(2, 1fr)'
          },
          [theme.breakpoints.up(1024)]: {
            gridTemplateColumns: 'repeat(3, 1fr)'
          }
        }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} sx={{
              height: 200,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: theme.shadows[1],
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ ml: 2, flexGrow: 1 }}>
                    <Skeleton variant="text" width="60%" height={28} />
                    <Skeleton variant="text" width="40%" height={24} />
                  </Box>
                </Box>
                <Skeleton variant="text" width="80%" height={24} />
                <Box sx={{ mt: 2 }}>
                  <Skeleton variant="text" width="40%" height={20} />
                  <Skeleton variant="rectangular" width="100%" height={36} sx={{ mt: 1, borderRadius: 1 }} />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <>
          <TextField
            variant='outlined'
            placeholder='Search patients by name, occupation or gender...'
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              // Debounce search to improve performance
              setTimeout(() => setSearchText(e.target.value), 300);
            }}
            sx={{
              width: '100%',
              maxWidth: 500,
              mb: 4,
              '& .MuiOutlinedInput-root': {
                borderRadius: 20,
              }
            }}
            aria-label='Search patients'
            size='medium'
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 20,
                  backgroundColor: theme.palette.background.default
                }
              }
            }}
          />

          <Box sx={{ minHeight: 400 }}>
            {filteredPatients.length === 0 ? (
              <Fade in={true}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    p: 8,
                    borderRadius: 4,
                    backgroundColor: theme.palette.grey[50],
                    border: `1px dashed ${theme.palette.divider}`
                  }}
                >
                  <PeopleAltIcon
                    sx={{
                      fontSize: 80,
                      color: theme.palette.grey[400],
                      mb: 2
                    }}
                  />
                  <Typography variant='h5' sx={{ mb: 1 }}>
                    No patients found
                  </Typography>
                  <Typography variant='body1' sx={{ color: theme.palette.text.secondary }}>
                    {searchText ?
                      'Try adjusting your search or add a new patient' :
                      'Add your first patient to get started'
                    }
                  </Typography>
                  {!searchText && (
                    <Button
                      variant='outlined'
                      onClick={openModal}
                      startIcon={<PersonAddIcon />}
                      sx={{
                        mt: 3,
                        borderRadius: 20,
                        px: 4,
                        py: 1
                      }}
                    >
                      Add First Patient
                    </Button>
                  )}
                </Box>
              </Fade>
            ) : (
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 3.45,
                [theme.breakpoints.up(320)]: {
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
                },
                [theme.breakpoints.up(768)]: {
                  gridTemplateColumns: 'repeat(2, 1fr)'
                },
                [theme.breakpoints.up(1024)]: {
                  gridTemplateColumns: 'repeat(3, 1fr)'
                }
              }}>
                {filteredPatients.map((patient) => (
                  <Slide key={patient.id} direction='up' in={true} timeout={300}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: theme.shadows[1],
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: theme.shadows[4]
                        }
                      }}
                    >
                      <CardActionArea
                        component={Link}
                        to={patient.id}
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          justifyContent: 'flex-start'
                        }}
                      >
                        <CardContent sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar
                              sx={{
                                bgcolor: getGenderColor(patient.gender),
                                mr: 2,
                                width: 40,
                                height: 40
                              }}
                            >
                              {patient.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography
                                variant='h6'
                                component='div'
                                sx={{
                                  fontWeight: 700,
                                  lineHeight: 1.2
                                }}
                              >
                                {patient.name}
                              </Typography>
                              <Typography
                                variant='body2'
                                sx={{
                                  color: theme.palette.text.secondary,
                                  textTransform: 'capitalize'
                                }}
                              >
                                {patient.gender}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{ mb: 1.5 }}
                          >
                            {patient.occupation}
                          </Typography>
                          
                          <Box sx={{ mt: 2 }}>
                            <Typography
                              variant='caption'
                              sx={{
                                display: 'block',
                                color: theme.palette.text.secondary,
                                mb: 0.5
                              }}
                            >
                              Latest Health Status
                            </Typography>
                            <HealthRatingBar
                              rating={getLatestHealthRating(patient)}
                              showText={true}
                            />
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Slide>
                ))}
              </Box>
            )}
          </Box>
        </>
      )}
      <AddPatientModal
        modalOpen={modalOpen}
        onSubmit={submitNewPatient}
        error={error}
        onClose={closeModal}
        loading={mutation.isPending}
      />
    </Paper>
  );
};

export default PatientListPage;
