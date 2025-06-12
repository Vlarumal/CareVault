import React from 'react';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { Link } from 'react-router-dom';
import { Patient } from '../../types';
import { mapToGridData } from '../../utils/patientDataMapper';
import HealthRatingBar from '../HealthRatingBar';
import DOMPurify from 'dompurify';

// Sanitize function to prevent XSS
const sanitize = (value: string): string => {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [], // Remove all HTML tags
    ALLOWED_ATTR: []  // Remove all attributes
  });
};

const columns: GridColDef[] = [
  {
    field: 'name',
    headerName: 'Name',
    width: 200,
    renderCell: (params) => (
      <Link to={`/${params.row.id}`} style={{ color: 'inherit' }}>
        {sanitize(params.value)}
      </Link>
    )
  },
  {
    field: 'gender',
    headerName: 'Gender',
    width: 120,
    renderCell: (params) => sanitize(params.value)
  },
  {
    field: 'occupation',
    headerName: 'Occupation',
    width: 200,
    renderCell: (params) => sanitize(params.value)
  },
  {
    field: 'dob',
    headerName: 'Date of Birth',
    width: 150,
    renderCell: (params) => sanitize(params.value)
  },
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
  pageSizeOptions: number[];
}

const PatientDataGrid: React.FC<PatientDataGridProps> = ({
  patients,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions
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
        pageSizeOptions={pageSizeOptions}
        onPaginationModelChange={(params: GridPaginationModel) => {
          onPageChange(params.page + 1); // Convert to 1-based
          onPageSizeChange(params.pageSize);
        }}
        disableRowSelectionOnClick
        aria-label="Patient data grid"
        disableVirtualization={process.env.NODE_ENV === 'test'}
      />
    </div>
  );
};

export default PatientDataGrid;