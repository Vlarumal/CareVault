import { useState, useEffect, useRef, useMemo } from 'react';
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
  Avatar,
  Tooltip,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import Skeleton from '@mui/material/Skeleton';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { GridFilterModel, GridSortModel } from '@mui/x-data-grid';

import {
  PatientFormValues,
  Patient,
  // HealthCheckEntry,
  // Entry,
} from '../../types';
import AddPatientModal from '../AddPatientModal';
import HealthRatingBar from '../HealthRatingBar';
import patientService, {
  PaginatedResponse,
} from '../../services/patients';
import { Link } from 'react-router-dom';
import { getIcon } from '../../utils';
import PatientDataGrid from './PatientDataGrid';
import ViewToggle from '../ViewToggle';
import { getLatestHealthRating } from '../../services/healthRatingService';
import {
  convertGridFilterModel,
  convertGridSortModel,
} from '../../utils/gridFilterConverter';
import { debounce } from '../../utils/debounce';

const PatientListPage = () => {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  const [searchText, setSearchText] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearchCommit = () => {
    const value = inputRef.current?.value || '';
    setSearchText(value);
    setRefreshTrigger(prev => prev + 1);
  };

  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setSearchText(value);
      setRefreshTrigger(prev => prev + 1);
    }, 1000),
    []
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (!value) {
      debouncedSearch.cancel();
      setSearchText('');
      setRefreshTrigger(prev => prev + 1);
    } else {
      debouncedSearch(value);
    }
  };

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);
  const [filterModel, setFilterModel] =
    useState<GridFilterModel | null>(null);
  const [sortModel, setSortModel] = useState<GridSortModel>([]);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    const savedViewMode = localStorage.getItem('patientListViewMode');
    return (savedViewMode === 'grid' ? 'grid' : 'list') as
      | 'list'
      | 'grid';
  });

  const theme = useTheme();
  const queryClient = useQueryClient();

  useEffect(() => {
    const savedViewMode = localStorage.getItem('patientListViewMode');
    if (savedViewMode === 'grid') {
      setViewMode('grid');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('patientListViewMode', viewMode);
  }, [viewMode]);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [10, 25, 50, 100];

  const {
    data: patientsData,
    isLoading,
    error: queryError,
  } = useQuery<PaginatedResponse<Patient[]>, Error>({
    queryKey: ['patients', page, pageSize, filterModel, sortModel, searchText, refreshTrigger],
    queryFn: async () => {
      const response = await patientService.getAll(
        true,
        page + 1,
        pageSize,
        convertGridFilterModel(filterModel),
        convertGridSortModel(
          sortModel as ReadonlyArray<{
            field: string;
            sort?: 'asc' | 'desc' | undefined | null;
          }>
        ),
        searchText
      ); // page + 1 for 1-based server index

      if ('metadata' in response) {
        return response as PaginatedResponse<Patient[]>;
      } else {
        // Convert non-paginated response to paginated format
        return {
          data: response as Patient[],
          metadata: {
            totalItems: (response as Patient[]).length,
            totalPages: 1,
            currentPage: 1,
            itemsPerPage: (response as Patient[]).length,
          },
        };
      }
    },
    staleTime: 300000, // 5 minutes
  });

  const totalCount = patientsData?.metadata.totalItems || 0;

  const mutation = useMutation({
    mutationFn: patientService.create,
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const openModal = (): void => setModalOpen(true);

  const closeModal = (): void => {
    setModalOpen(false);
    setError(undefined);
  };

  const submitNewPatient = async (values: PatientFormValues) => {
    // Optimistic update with temporary ID
    const tempId = `temp-${Date.now()}`;
    const optimisticPatient: Patient = {
      ...values,
      id: tempId,
      entries: [],
    };

    // Update cache immediately
    queryClient.setQueryData(
      ['patients', page, pageSize],
      (
        oldData: Patient[] | PaginatedResponse<Patient[]> | undefined
      ) => {
        if (!oldData) {
          return {
            data: [optimisticPatient],
            metadata: {
              totalItems: 1,
              totalPages: 1,
              currentPage: 1,
              itemsPerPage: 10,
            },
          };
        }

        const oldPatients = Array.isArray(oldData)
          ? oldData
          : oldData?.data || [];
        const newData = [...oldPatients, optimisticPatient];

        return {
          data: newData,
          metadata: {
            totalItems: newData.length,
            totalPages: Math.ceil(newData.length / pageSize),
            currentPage: 1,
            itemsPerPage: pageSize,
          },
        };
      }
    );

    setModalOpen(false);

    mutation.mutate(values, {
      onSuccess: (createdPatient) => {
        // Replace optimistic patient with server response
        queryClient.setQueryData(
          ['patients', page, pageSize],
          (
            oldData:
              | Patient[]
              | PaginatedResponse<Patient[]>
              | undefined
          ) => {
            if (!oldData) return [createdPatient];

            const oldPatients = Array.isArray(oldData)
              ? oldData
              : oldData?.data || [];
            const updatedPatients = oldPatients.map((p: Patient) =>
              p.id === tempId ? createdPatient : p
            );

            return {
              data: updatedPatients,
              metadata: {
                totalItems: updatedPatients.length,
                totalPages: Math.ceil(
                  updatedPatients.length / pageSize
                ),
                currentPage: 1,
                itemsPerPage: pageSize,
              },
            };
          }
        );
      },
      onError: () => {
        // Rollback on error
        queryClient.setQueryData(
          ['patients', page, pageSize],
          (
            oldData:
              | Patient[]
              | PaginatedResponse<Patient[]>
              | undefined
          ) => {
            if (!oldData) return [];

            const oldPatients = Array.isArray(oldData)
              ? oldData
              : oldData?.data || [];
            const filteredPatients = oldPatients.filter(
              (p: Patient) => p.id !== tempId
            );

            return {
              data: filteredPatients,
              metadata: {
                totalItems: filteredPatients.length,
                totalPages: Math.ceil(
                  filteredPatients.length / pageSize
                ),
                currentPage: 1,
                itemsPerPage: pageSize,
              },
            };
          }
        );
      },
    });
  };

  const getGenderColor = (gender: string) => {
    switch (gender.toLowerCase()) {
      case 'male':
        return theme.palette.primary.main;
      case 'female':
        return theme.palette.secondary.main;
      default:
        return (
          (theme.palette as { tertiary?: { main: string } }).tertiary
            ?.main || theme.palette.grey[500]
        );
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
          boxShadow: theme.shadows[3],
        },
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
              color: theme.palette.primary.main,
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
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Icon button for xs screens only */}
          <Tooltip title='Add New Patient'>
            <IconButton
              onClick={openModal}
              sx={{
                display: { xs: 'inline-flex', sm: 'none' },
                ml: 2,
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
                transition: 'all 0.3s ease',
                borderRadius: '50%',
                boxShadow: theme.shadows[1],
                '&:focus': {
                  outline: 'none',
                  boxShadow: `0 0 0 3px ${theme.palette.primary.light}`,
                },
                '&:active': {
                  transform: 'translateY(2px)',
                },
              }}
              aria-label='Add new patient'
            >
              <PersonAddIcon fontSize='large' />
            </IconButton>
          </Tooltip>

          {/* Regular button for sm screens and above */}
          <Button
            variant='contained'
            onClick={openModal}
            startIcon={<PersonAddIcon />}
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              minWidth: { sm: 180, md: 200 },
              px: { sm: 2 },
              py: { sm: 1.5 },
              fontSize: { sm: '1rem' },
              fontWeight: 600,
              boxShadow: theme.shadows[1],
              '&:hover': {
                boxShadow: theme.shadows[3],
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
            aria-label='Add new patient'
          >
            Add New Patient
          </Button>
        </Box>
      </Box>
      {queryError && (
        <Box
          sx={{
            p: 3,
            backgroundColor: theme.palette.error.light,
            color: theme.palette.error.contrastText,
            borderRadius: 2,
            textAlign: 'center',
            my: 2,
          }}
          data-testid='error-message'
        >
          <Typography variant='body1'>
            Error: {queryError.message}
          </Typography>
        </Box>
      )}

      {!queryError && (isLoading) ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 3.45,
            [theme.breakpoints.up(320)]: {
              gridTemplateColumns:
                'repeat(auto-fill, minmax(280px, 1fr))',
            },
            [theme.breakpoints.up(768)]: {
              gridTemplateColumns: 'repeat(2, 1fr)',
            },
            [theme.breakpoints.up(1024)]: {
              gridTemplateColumns: 'repeat(3, 1fr)',
            },
          }}
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <Card
              key={index}
              data-testid='patient-skeleton'
              sx={{
                height: 200,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: theme.shadows[1],
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Skeleton
                    variant='circular'
                    width={40}
                    height={40}
                  />
                  <Box sx={{ ml: 2, flexGrow: 1 }}>
                    <Skeleton
                      variant='text'
                      width='60%'
                      height={28}
                    />
                    <Skeleton
                      variant='text'
                      width='40%'
                      height={24}
                    />
                  </Box>
                </Box>
                <Skeleton
                  variant='text'
                  width='80%'
                  height={24}
                />
                <Box sx={{ mt: 2 }}>
                  <Skeleton
                    variant='text'
                    width='40%'
                    height={20}
                  />
                  <Skeleton
                    variant='rectangular'
                    width='100%'
                    height={36}
                    sx={{ mt: 1, borderRadius: 1 }}
                  />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        !queryError && (
          <>
            <Box
              sx={{ display: 'flex', alignItems: 'center', mb: 3 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', maxWidth: 500 }}>
                <TextField
                  variant='outlined'
                  placeholder='Search patients by name, occupation or gender...'
                  defaultValue={searchText}
                  onChange={handleSearchChange}
                  onBlur={handleSearchCommit}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchCommit()}
                  ref={inputRef}
                  sx={{
                    flexGrow: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 20,
                    },
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
                        backgroundColor:
                          theme.palette.background.default,
                      },
                    },
                  }}
                />
                <Tooltip title='Refresh results'>
                  <IconButton
                    onClick={() => setRefreshTrigger(prev => prev + 1)}
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                      border: `1px solid ${theme.palette.divider}`,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                        transform: 'rotate(360deg)',
                      },
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      transition: 'all 0.3s ease',
                      boxShadow: theme.shadows[1],
                    }}
                    aria-label='Refresh patient list'
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <ViewToggle
                value={viewMode}
                onChange={setViewMode}
              />
            </Box>

            <Box sx={{ minHeight: 400 }}>
              {patientsData?.data?.length === 0 ? (
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
                      border: `1px dashed ${theme.palette.divider}`,
                    }}
                  >
                    <PeopleAltIcon
                      sx={{
                        fontSize: 80,
                        color: theme.palette.grey[400],
                        mb: 2,
                      }}
                    />
                    <Typography
                      variant='h5'
                      sx={{ mb: 1 }}
                    >
                      No patients found
                    </Typography>
                    <Typography
                      variant='body1'
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {searchText
                        ? 'Try adjusting your search or add a new patient'
                        : 'Add your first patient to get started'}
                    </Typography>
                    {!searchText && (
                      <Button
                        variant='outlined'
                        onClick={openModal}
                        startIcon={<PersonAddIcon />}
                        sx={{
                          mt: { xs: 3, md: 4 },
                          borderRadius: 20,
                          px: { xs: 2, sm: 3, md: 4 },
                          py: { xs: 1, md: 1.5 },
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                          width: '100%',
                          maxWidth: { xs: '100%', sm: 300 },
                          textAlign: 'center',
                          '& .MuiButton-startIcon': {
                            marginRight: { xs: 1, md: 2 },
                          },
                        }}
                      >
                        Add First Patient
                      </Button>
                    )}
                  </Box>
                </Fade>
              ) : viewMode === 'grid' ? (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: 3.45,
                    [theme.breakpoints.up(320)]: {
                      gridTemplateColumns:
                        'repeat(auto-fill, minmax(280px, 1fr))',
                    },
                    [theme.breakpoints.up(768)]: {
                      gridTemplateColumns: 'repeat(2, 1fr)',
                    },
                    [theme.breakpoints.up(1024)]: {
                      gridTemplateColumns: 'repeat(3, 1fr)',
                    },
                  }}
                >
                  {patientsData?.data?.map((patient: Patient) => (
                    <Slide
                      key={patient.id}
                      direction='up'
                      in={true}
                      timeout={300}
                    >
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
                            boxShadow: theme.shadows[4],
                          },
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
                            justifyContent: 'flex-start',
                          }}
                        >
                          <CardContent sx={{ width: '100%' }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2,
                              }}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: getGenderColor(
                                    patient.gender
                                  ),
                                  mr: 2,
                                  width: 40,
                                  height: 40,
                                }}
                              >
                                {getIcon(patient.gender)}
                              </Avatar>
                              <Box>
                                <Typography
                                  variant='h6'
                                  component='div'
                                  sx={{
                                    fontWeight: 700,
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {patient.name}
                                </Typography>
                                <Typography
                                  variant='body2'
                                  sx={{
                                    color:
                                      theme.palette.text.secondary,
                                    textTransform: 'capitalize',
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
                                  mb: 0.5,
                                }}
                              >
                                Latest Health Status
                              </Typography>
                              <HealthRatingBar
                                rating={
                                  patient.healthRating ??
                                  (patient.entries ? getLatestHealthRating(patient.entries) : null)
                                }
                                showText={true}
                              />
                            </Box>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Slide>
                  ))}
                </Box>
              ) : (
                <PatientDataGrid
                  patients={patientsData?.data || []}
                  page={page}
                  pageSize={pageSize}
                  onPageChange={(newPage: number) => {
                    setPage(newPage);
                  }}
                  onPageSizeChange={(newPageSize: number) => {
                    if (newPageSize !== pageSize) {
                      setPageSize(newPageSize);
                      setPage(0);
                    }
                  }}
                  pageSizeOptions={pageSizeOptions}
                  totalCount={totalCount}
                  filterModel={filterModel}
                  onFilterModelChange={(
                    newFilterModel: GridFilterModel
                  ) => {
                    setFilterModel(newFilterModel);
                  }}
                  sortModel={sortModel}
                  onSortModelChange={(
                    newSortModel: GridSortModel
                  ) => {
                    setSortModel(newSortModel);
                  }}
                />
              )}
            </Box>
          </>
        )
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
