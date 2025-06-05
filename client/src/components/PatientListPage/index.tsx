import { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  InputAdornment,
  TextField,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import {
  DataGrid,
  GridColDef,
  GridToolbarContainer,
  GridToolbarExport,
} from '@mui/x-data-grid';
import axios from 'axios';

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

interface Props {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
}

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

// Custom toolbar with search and export
function CustomToolbar({
  searchText,
  setSearchText,
}: {
  searchText: string;
  setSearchText: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <GridToolbarContainer
      sx={{ justifyContent: 'space-between', py: 1 }}
    >
      <TextField
        variant='standard'
        placeholder='Search patients...'
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ width: 300 }}
        aria-label='Search patients'
      />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
}

const PatientListPage = ({ patients, setPatients }: Props) => {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  const [searchText, setSearchText] = useState<string>('');

  const openModal = (): void => setModalOpen(true);

  const closeModal = (): void => {
    setModalOpen(false);
    setError(undefined);
  };

  const submitNewPatient = async (values: PatientFormValues) => {
    try {
      const patient = await patientService.create(values);
      setPatients(patients.concat(patient));
      setModalOpen(false);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        if (
          e?.response?.data &&
          typeof e?.response?.data === 'string'
        ) {
          const message = e.response.data.replace(
            'Something went wrong. Error: ',
            ''
          );
          console.error(message);
          setError(message);
        } else {
          setError('Unrecognized axios error');
        }
      } else if (e instanceof Error) {
        console.error(e.message);
        setError(e.message);
      } else {
        console.error('Unknown error', e);
        setError('Unknown error');
      }
    }
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

  // Define columns for DataGrid
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Patient Name',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Link
          to={params.row.id}
          style={{ color: '#1976d2', fontWeight: 600 }}
          aria-label={`View details for ${params.value}`}
        >
          {params.value}
        </Link>
      ),
    },
    {
      field: 'gender',
      headerName: 'Gender',
      width: 120,
      valueGetter: (params) =>
        params.value.charAt(0).toUpperCase() + params.value.slice(1),
    },
    {
      field: 'occupation',
      headerName: 'Occupation',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'healthRating',
      headerName: 'Health Status',
      width: 180,
      renderCell: (params) => (
        <div data-testid='health-rating-bar'>
          <HealthRatingBar
            rating={params.value}
            showText={false}
          />
        </div>
      ),
    },
  ];

  // Prepare data for DataGrid
  const rows = filteredPatients.map((patient) => ({
    id: patient.id,
    name: patient.name,
    gender: patient.gender,
    occupation: patient.occupation,
    healthRating: getLatestHealthRating(patient),
  }));

  return (
    <div className='App'>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography
          variant='h5'
          component='h1'
          aria-label='Patient list header'
        >
          Patient List
        </Typography>
        <Button
          variant='contained'
          onClick={openModal}
          sx={{ minWidth: 180 }}
          aria-label='Add new patient'
        >
          Add New Patient
        </Button>
      </Box>

      <div style={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 7,
                page: 0,
              },
            },
          }}
          pageSizeOptions={[7, 15, 30]}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
            },
          }}
          slots={{
            toolbar: () => (
              <CustomToolbar
                searchText={searchText}
                setSearchText={setSearchText}
              />
            ),
            noRowsOverlay: () => (
              <div style={{ textAlign: 'center', padding: 20 }}>
                No patients found
              </div>
            ),
          }}
          slotProps={{
            filterPanel: { columnsSort: 'asc' },
          }}
          aria-label='Patient list with search and export'
          getRowClassName={(params) => `row-${params.row.id}`} // Add class-based identifier
        />
      </div>

      <AddPatientModal
        modalOpen={modalOpen}
        onSubmit={submitNewPatient}
        error={error}
        onClose={closeModal}
      />
    </div>
  );
};

export default PatientListPage;
