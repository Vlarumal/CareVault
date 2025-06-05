import { useState, useMemo } from "react";
import { 
  Box, 
  Button, 
  Typography,
  InputAdornment,
  TextField
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import axios from 'axios';

import { PatientFormValues, Patient, HealthCheckEntry, Entry } from "../../types";
import AddPatientModal from "../AddPatientModal";
import HealthRatingBar from "../HealthRatingBar";
import patientService from "../../services/patients";
import { Link } from "react-router-dom";

interface Props {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
}

// Helper to get latest health rating from entries
const getLatestHealthRating = (patient: Patient): number | null => {
  if (!patient.entries) return null;
  
  const healthCheckEntries = patient.entries.filter(
    (entry: Entry): entry is HealthCheckEntry => entry.type === 'HealthCheck'
  );
  
  if (healthCheckEntries.length === 0) return null;
  
  const sortedEntries = [...healthCheckEntries].sort(
    (a, b) => b.date.localeCompare(a.date)
  );
  
  return sortedEntries[0].healthCheckRating;
};

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
        if (e?.response?.data && typeof e?.response?.data === "string") {
          const message = e.response.data.replace('Something went wrong. Error: ', '');
          console.error(message);
          setError(message);
        } else {
          setError("Unrecognized axios error");
        }
      } else if (e instanceof Error) {
        console.error(e.message);
        setError(e.message);
      } else {
        console.error("Unknown error", e);
        setError("Unknown error");
      }
    }
  };

  // Filter patients based on search text
  const filteredPatients = useMemo(() => {
    if (!searchText) return patients;
    const lowerSearch = searchText.toLowerCase();
    return patients.filter(patient => 
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
      minWidth: 200,
      renderCell: (params) => (
        <Link to={params.row.id} style={{ color: '#1976d2', fontWeight: 600 }}>
          {params.value}
        </Link>
      )
    },
    { 
      field: 'gender', 
      headerName: 'Gender', 
      width: 120,
      valueGetter: (params) => 
        params.value.charAt(0).toUpperCase() + params.value.slice(1)
    },
    { 
      field: 'occupation', 
      headerName: 'Occupation', 
      flex: 1,
      minWidth: 200 
    },
    { 
      field: 'healthRating', 
      headerName: 'Health Status', 
      width: 180,
      renderCell: (params) => (
        <div data-testid="health-rating-bar">
          <HealthRatingBar rating={params.value} showText={false} />
        </div>
      )
    }
  ];

  // Prepare data for DataGrid
  const rows = filteredPatients.map(patient => ({
    id: patient.id,
    name: patient.name,
    gender: patient.gender,
    occupation: patient.occupation,
    healthRating: getLatestHealthRating(patient)
  }));

  return (
    <div className="App">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">
          Patient List
        </Typography>
        <Button 
          variant="contained" 
          onClick={openModal}
          sx={{ minWidth: 180 }}
        >
          Add New Patient
        </Button>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search patients..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      <div style={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={7}
          rowsPerPageOptions={[7, 15, 30]}
          disableSelectionOnClick
          sx={{
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold'
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.04)'
            }
          }}
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
