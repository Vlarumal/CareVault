import React, { useEffect, useRef } from 'react';
import { formatDateUTC } from '../../utils/dateUtils';
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  Alert,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  Entry,
  DiagnosisEntry,
  NewEntryFormValues,
} from '../../types';
import { entryToFormValues } from '@shared/src/utils/typeUtils';
import useEntryForm from '../../hooks/useEntryForm';

interface Props {
  patientId: string;
  onCancel: () => void;
  onSubmit: (values: NewEntryFormValues) => void;
  onSuccess?: () => void;
  error?: string;
  loading?: boolean;
  isEditMode?: boolean;
  existingEntry?: Entry;
  diagnosisCodesAll: DiagnosisEntry[];
  title?: string;
}

const EntryForm: React.FC<Props> = ({
  patientId,
  onCancel,
  onSubmit,
  error,
  isEditMode = false,
  existingEntry,
  diagnosisCodesAll,
  title = isEditMode ? 'Edit Entry' : 'Add New Entry',
}) => {
  const mode = isEditMode ? 'edit' : 'add';
  const firstInputRef = useRef<HTMLInputElement>(null);

  const {
    formValues,
    error: formError,
    loading: formLoading,
    handleChange,
    handleSubmit: handleFormSubmit,
    handleReasonChange,
    errors,
  } = useEntryForm({
    mode,
    patientId,
    entryId: existingEntry?.id,
    initialValues: existingEntry
      ? entryToFormValues(existingEntry)
      : {
          type: 'HealthCheck',
          description: '',
          date: formatDateUTC(new Date()),
          specialist: '',
          healthCheckRating: 0,
          updatedAt: new Date().toISOString(),
        },
    onSubmit: async (values) => {
      await onSubmit(values);
    },
    onSuccess: (_values: NewEntryFormValues) => {
      // Success is handled by the parent component
    },
  });


  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  const renderEntryTypeFields = () => {
    switch (formValues.type) {
      case 'Hospital':
        return (
          <>
            <TextField
              label='Discharge date'
              value={formValues.discharge?.date?.split('T')[0] || ''}
              onChange={(e) => {
                const dateValue = e.target.value;
                const isoDate = dateValue ? new Date(dateValue + 'T00:00:00Z').toISOString() : '';
                handleChange('discharge', {
                  date: isoDate,
                  criteria: formValues.discharge?.criteria || '',
                });
              }}
              fullWidth
              margin='normal'
              type='date'
              required
              error={!!errors.dischargeDate}
              helperText={
                errors.dischargeDate ||
                'Date when the patient was discharged'
              }
              slotProps={{
                inputLabel: { shrink: true }
              }}
            />
            <TextField
              label='Discharge criteria'
              value={formValues.discharge?.criteria || ''}
              onChange={(e) =>
                handleChange('discharge', {
                  date: formValues.discharge?.date || '',
                  criteria: e.target.value,
                })
              }
              fullWidth
              margin='normal'
              required
              error={!!errors.dischargeCriteria}
              helperText={
                errors.dischargeCriteria ||
                'Criteria for discharge (max 500 characters)'
              }
              slotProps={{
                htmlInput: { maxLength: 500 }
              }}
            />
          </>
        );
      case 'OccupationalHealthcare':
        return (
          <>
            <TextField
              label='Employer Name'
              value={formValues.employerName || ''}
              onChange={(e) =>
                handleChange('employerName', e.target.value)
              }
              fullWidth
              margin='normal'
              required
              error={!!errors.employerName}
              helperText={
                errors.employerName ||
                'Name of the employer (max 100 characters)'
              }
              slotProps={{
                htmlInput: { maxLength: 100 }
              }}
            />
            <TextField
              label='Sick leave start date'
              value={formValues.sickLeave?.startDate?.split('T')[0] || ''}
              onChange={(e) => {
                const dateValue = e.target.value;
                const isoDate = dateValue ? new Date(dateValue + 'T00:00:00Z').toISOString() : '';
                handleChange('sickLeave', {
                  startDate: isoDate,
                  endDate: formValues.sickLeave?.endDate || '',
                });
              }}
              fullWidth
              margin='normal'
              type='date'
              error={!!errors.sickLeaveStartDate}
              helperText={
                errors.sickLeaveStartDate ||
                'Start date of sick leave (optional)'
              }
              slotProps={{
                inputLabel: { shrink: true }
              }}
            />
            <TextField
              label='Sick leave end date'
              value={formValues.sickLeave?.endDate?.split('T')[0] || ''}
              onChange={(e) => {
                const dateValue = e.target.value;
                const isoDate = dateValue ? new Date(dateValue + 'T00:00:00Z').toISOString() : '';
                handleChange('sickLeave', {
                  startDate: formValues.sickLeave?.startDate || '',
                  endDate: isoDate,
                });
              }}
              fullWidth
              margin='normal'
              type='date'
              error={!!errors.sickLeaveEndDate}
              helperText={
                errors.sickLeaveEndDate ||
                'End date of sick leave (optional)'
              }
              slotProps={{
                inputLabel: { shrink: true }
              }}
            />
          </>
        );
      case 'HealthCheck':
        return (
          <FormControl
            fullWidth
            margin='normal'
          >
            <InputLabel>Health Rating</InputLabel>
            <Select
              value={formValues.healthCheckRating || 0}
              onChange={(e) =>
                handleChange(
                  'healthCheckRating',
                  Number(e.target.value)
                )
              }
              name='healthCheckRating'
              required
              error={!!errors.healthCheckRating}
            >
              <MenuItem value={0}>Healthy</MenuItem>
              <MenuItem value={1}>Low Risk</MenuItem>
              <MenuItem value={2}>High Risk</MenuItem>
              <MenuItem value={3}>Critical Risk</MenuItem>
            </Select>
            {errors.healthCheckRating && (
              <Typography
                variant='caption'
                color='error'
              >
                {errors.healthCheckRating}
              </Typography>
            )}
            {!errors.healthCheckRating && (
              <Typography variant='caption'>
                Rating from 0 (healthy) to 3 (critical risk)
              </Typography>
            )}
          </FormControl>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography
        variant='h6'
        gutterBottom
      >
        {title}
      </Typography>
      {(error || formError) && (
        <Alert
          severity='error'
          sx={{ mb: 3 }}
        >
          {error || formError}
        </Alert>
      )}
      <Box
        component='form'
        onSubmit={async (e) => {
          e.preventDefault();
          if (!formLoading) {
            await handleFormSubmit();
          }
        }}
      >
        <FormControl
          fullWidth
          margin='normal'
        >
          <InputLabel>Entry Type</InputLabel>
          <Select
            value={formValues.type}
            onChange={(e) => handleChange('type', e.target.value)}
            label='Entry Type'
            disabled={isEditMode}
          >
            <MenuItem value='HealthCheck'>Health Check</MenuItem>
            <MenuItem value='Hospital'>Hospital</MenuItem>
            <MenuItem value='OccupationalHealthcare'>
              Occupational Healthcare
            </MenuItem>
          </Select>
        </FormControl>

        <TextField
          label='Description'
          value={formValues.description}
          onChange={(e) =>
            handleChange('description', e.target.value)
          }
          fullWidth
          margin='normal'
          error={!!errors.description}
          helperText={
            errors.description ||
            'Brief description of the entry (max 500 characters)'
          }
          required
          inputRef={firstInputRef}
          slotProps={{
            htmlInput: { maxLength: 500 }
          }}
        />

        <TextField
          label='Date'
          type='date'
          value={formValues.date.split('T')[0]}
          onChange={(e) => {
            const dateValue = e.target.value;
            const isoDate = dateValue ? new Date(dateValue + 'T00:00:00Z').toISOString() : '';
            handleChange('date', isoDate);
          }}
          fullWidth
          margin='normal'
          error={!!errors.date}
          helperText={errors.date || 'Date of the entry'}
          required
          slotProps={{
            inputLabel: { shrink: true }
          }}
        />

        <TextField
          label='Specialist'
          value={formValues.specialist}
          onChange={(e) => handleChange('specialist', e.target.value)}
          fullWidth
          margin='normal'
          error={!!errors.specialist}
          helperText={
            errors.specialist ||
            'Name of the specialist (max 100 characters)'
          }
          required
          slotProps={{
            htmlInput: { maxLength: 100 }
          }}
        />

        <Autocomplete
          options={diagnosisCodesAll.filter((d) => d?.code)}
          getOptionLabel={(option) => {
            if (typeof option === 'string') return option;
            return option?.code || '';
          }}
          value={
            formValues.diagnosisCodes
              ? formValues.diagnosisCodes
                  .map(
                    (code) =>
                      diagnosisCodesAll.find(
                        (d) => d?.code === code
                      ) || code
                  )
                  .filter(Boolean)
              : []
          }
          onChange={(_, newValue) => {
            const filteredNewValue = newValue.filter(v =>
              v !== null && v !== undefined && v !== ''
            );
            
            const cleaned = filteredNewValue
              .map((v) => {
                if (typeof v === 'string') return v.trim();
                return v?.code?.trim() || '';
              })
              .filter((code) => code !== '');

            handleChange('diagnosisCodes', cleaned.length ? cleaned : []);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label='Diagnosis Codes (Optional)'
              placeholder='Enter ICD-10 codes'
              error={!!errors.diagnosisCodes}
              helperText={
                errors.diagnosisCodes ||
                'Search and select one or more diagnosis codes'
              }
            />
          )}
          multiple
          freeSolo
          fullWidth
          sx={{ mb: 2 }}
        />
        {renderEntryTypeFields()}

        {isEditMode && (
          <TextField
            label='Change Reason'
            onChange={(e) => handleReasonChange(e.target.value)}
            placeholder='Describe what changed and why (min 10 chars)'
            fullWidth
            margin='normal'
            error={!!errors.changeReason}
            helperText={errors.changeReason}
            required
          />
        )}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
            mt: 3,
          }}
        >
          <Button
            variant='outlined'
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            type='submit'
            disabled={formLoading}
          >
            {formLoading ? (
              <CircularProgress size={24} />
            ) : isEditMode ? (
              'Update Entry'
            ) : (
              'Add Entry'
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default EntryForm;
