import React from 'react';
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridFilterModel,
  GridSortModel,
} from '@mui/x-data-grid';
import { Link } from 'react-router-dom';
import { Patient } from '../../types';
import { mapToGridData } from '../../utils/patientDataMapper';
import HealthRatingBar from '../HealthRatingBar';
import DOMPurify from 'dompurify';
import DeletePatientButton from '../DeletePatientButton';
import Box from '@mui/material/Box';

const sanitize = (value: string): string => {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
};

interface PatientDataGridProps {
  patients: Patient[];
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions: number[];
  filterModel?: GridFilterModel | null;
  onFilterModelChange?: (filterModel: GridFilterModel) => void;
  sortModel?: GridSortModel;
  onSortModelChange?: (sortModel: GridSortModel) => void;
  refetchPatients: () => void;
}

const PatientDataGrid: React.FC<PatientDataGridProps> = ({
  patients,
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
  filterModel,
  onFilterModelChange,
  sortModel,
  onSortModelChange,
  refetchPatients,
}) => {
  const rows = mapToGridData(patients);
  
  const handleDeleteSuccess = () => {
    refetchPatients();
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      renderCell: (params) => (
        <Link
          to={`/${params.row.id}`}
          style={{ color: 'inherit' }}
        >
          {sanitize(params.value)}
        </Link>
      ),
    },
    {
      field: 'gender',
      headerName: 'Gender',
      width: 130,
      renderCell: (params) => sanitize(params.value),
    },
    {
      field: 'occupation',
      headerName: 'Occupation',
      width: 200,
      renderCell: (params) => sanitize(params.value),
    },
    {
      field: 'dateOfBirth',
      headerName: 'Date of Birth',
      width: 150,
      renderCell: (params) => sanitize(params.value),
    },
    {
      field: 'healthRating',
      headerName: 'Health Rating',
      width: 240,
      renderCell: (params) => (
        <HealthRatingBar
          rating={params.value}
          showText={true}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box display="flex" justifyContent="flex-end">
          <DeletePatientButton
            patientId={params.row.id}
            patientName={params.row.name}
            onSuccess={handleDeleteSuccess}
          />
        </Box>
      ),
    },
  ];

  return (
    <div style={{ height: 600, width: '100%', marginTop: 16 }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pagination
        paginationMode='server'
        rowCount={totalCount}
        paginationModel={{
          page: page,
          pageSize: pageSize,
        }}
        pageSizeOptions={pageSizeOptions}
        onPaginationModelChange={(params: GridPaginationModel) => {
          onPageChange(params.page);
          onPageSizeChange(params.pageSize);
        }}
        filterModel={filterModel || undefined}
        onFilterModelChange={onFilterModelChange}
        sortModel={sortModel}
        onSortModelChange={onSortModelChange}
        filterMode='server'
        sortingMode='server'
        disableRowSelectionOnClick
        aria-label='Patient data grid'
        disableVirtualization={process.env.NODE_ENV === 'test'}
      />
    </div>
  );
};

export default PatientDataGrid;
