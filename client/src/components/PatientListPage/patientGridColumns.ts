import React from 'react';
import { GridColDef } from '@mui/x-data-grid';
import { Link } from 'react-router-dom';
import HealthRatingBar from '../HealthRatingBar';
import DeletePatientButton from '../DeletePatientButton';
import Box from '@mui/material/Box';
import DOMPurify from 'dompurify';

const sanitize = (value: string): string => {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
};

export const getPatientGridColumns = (
  refetchPatients: () => void
): GridColDef[] => [
  {
    field: 'name',
    headerName: 'Name',
    width: 200,
    renderCell: (params) => (
      React.createElement(
        Link,
        {
          to: `/${params.row.id}`,
          style: { color: 'inherit' },
          'aria-label': `View details for ${params.value}`
        },
        sanitize(params.value as string)
      )
    ),
  },
  {
    field: 'gender',
    headerName: 'Gender',
    width: 130,
    renderCell: (params) => sanitize(params.value as string),
  },
  {
    field: 'occupation',
    headerName: 'Occupation',
    width: 200,
    renderCell: (params) => sanitize(params.value as string),
  },
  {
    field: 'dateOfBirth',
    headerName: 'Date of Birth',
    width: 150,
    renderCell: (params) => sanitize(params.value as string),
  },
  {
    field: 'healthRating',
    headerName: 'Health Rating',
    width: 160,
    renderCell: (params) => (
      React.createElement(
        Box,
        {
          display: 'flex',
          alignItems: 'center',
          height: '100%'
        },
        React.createElement(HealthRatingBar, {
          rating: params.value as number,
          showText: false
        })
      )
    ),
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 120,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      React.createElement(
        Box,
        {
          display: 'flex',
          justifyContent: 'flex-end'
        },
        React.createElement(DeletePatientButton, {
          patientId: params.row.id as string,
          patientName: params.row.name as string,
          onSuccess: refetchPatients
        })
      )
    ),
  },
];