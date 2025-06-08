import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Link } from 'react-router-dom';
import { Patient } from '../../types';
import { mapToGridData } from '../../utils/patientDataMapper';
import HealthRatingBar from '../HealthRatingBar';

const columns: GridColDef[] = [
  {
    field: 'name',
    headerName: 'Name',
    width: 200,
    renderCell: (params) => (
      <Link to={`/patients/${params.row.id}`} style={{ color: 'inherit' }}>
        {params.value}
      </Link>
    )
  },
  { field: 'gender', headerName: 'Gender', width: 120 },
  { field: 'occupation', headerName: 'Occupation', width: 200 },
  { field: 'dob', headerName: 'Date of Birth', width: 150 },
  {
    field: 'latestRating',
    headerName: 'Health Rating',
    width: 180,
    renderCell: (params) => (
      <HealthRatingBar rating={params.value} showText={true} />
    )
  }
];

interface PatientDataGridProps {
  patients: Patient[];
}

const PatientDataGrid: React.FC<PatientDataGridProps> = ({ patients }) => {
  const rows = mapToGridData(patients);

  return (
    <div style={{ height: 600, width: '100%', marginTop: 16 }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
      />
    </div>
  );
};

export default PatientDataGrid;