import React from 'react';
import {
  DataGrid,
  GridPaginationModel,
  GridFilterModel,
  GridSortModel,
} from '@mui/x-data-grid';
import { Patient } from '../../types';
import { mapToGridData } from '../../utils/patientDataMapper';
import { getPatientGridColumns } from './patientGridColumns';

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

  const columns = getPatientGridColumns(handleDeleteSuccess);

  return (
    <div style={{ height: 600, width: '100%', marginTop: 16 }}>
      <DataGrid
        sx={{
          '& .MuiDataGrid-row': {
            '&:focus-within': {
              outline: '2px solid #1976d2',
            },
          },
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-actionsCell': {
            opacity: 0,
            transition: 'opacity 0.3s ease',
          },
          '& .MuiDataGrid-row:hover .MuiDataGrid-actionsCell': {
            opacity: 1,
          },
        }}
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
