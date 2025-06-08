import React from 'react';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
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
      <Link to={`/${params.row.id}`} style={{ color: 'inherit' }}>
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
    width: 280,
    renderCell: (params) => (
      <HealthRatingBar rating={params.value} showText={true} />
    )
  }
];

interface PatientDataGridProps {
  patients: Patient[];
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions: number[]; // Add new prop
}

const PatientDataGrid: React.FC<PatientDataGridProps> = ({
  patients,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange
}) => {
  const rows = mapToGridData(patients);

  return (
    <div style={{ height: 600, width: '100%', marginTop: 16 }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pagination
        paginationMode="client"
        paginationModel={{
          page: page - 1, // DataGrid uses 0-based index
          pageSize: pageSize
        }}
        pageSizeOptions={[10, 25, 50]}
        onPaginationModelChange={(params: GridPaginationModel) => {
          onPageChange(params.page + 1); // Convert to 1-based
          onPageSizeChange(params.pageSize);
        }}
        disableRowSelectionOnClick
        aria-label="Patient data grid"
      />
    </div>
  );
};

export default PatientDataGrid;