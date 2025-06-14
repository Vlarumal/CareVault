import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Drawer,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import React, { useState, useEffect, useRef } from 'react';
import {
  Entry,
  NewEntryFormValues,
  BaseEntry,
  DiagnosisEntry,
} from '../../types';
import {
  isDateValid,
  validateDateRange,
  validateHealthRating,
  validateRequired,
} from '../../utils';

interface Props {
  onAddEntry: (values: NewEntryFormValues) => void;
  error: string | undefined;
  loading: boolean;
  diagnosisCodesAll: DiagnosisEntry[];
  onClose?: () => void;
  open: boolean;
}

const AddEntryForm: React.FC<Props> = ({
  onAddEntry,
  error,
  loading,
  diagnosisCodesAll,
  onClose,
  open,
}) => {
  const initialFormState = {
    description: '',
    date: '',
    specialist: '',
    diagnosisCodes: [] as DiagnosisEntry[],
    healthCheckRating: 0,
    dischargeDate: '',
    dischargeCriteria: '',
    employerName: '',
    sickLeaveStartDate: '',
    sickLeaveEndDate: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitCount, setSubmitCount] = useState(0);
  const [entryType, setEntryType] =
    useState<Entry['type']>('HealthCheck');
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (Object.values(errors).some((e) => e)) {
      const errorMessages = Object.values(errors)
        .filter((e) => e)
        .join('. ');
      const liveRegion = document.getElementById(
        'a11y-announcements'
      );
      if (liveRegion) {
        liveRegion.textContent = `Form errors: ${errorMessages}`;
      }

      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const input = document.getElementById(
          `${firstErrorField}-input`
        );
        if (input) {
          input.focus();
        }
      }
    }
  }, [errors]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    validateField(name, value);
  };

  const validateField = (fieldName: string, value: string) => {
    let error = '';

    switch (fieldName) {
      case 'description':
      case 'date':
      case 'dischargeCriteria':
      case 'employerName':
        error = validateRequired(
          value,
          fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
        );
        break;
      case 'specialist':
        error = validateRequired(value, 'Specialist');
        break;
      case 'healthCheckRating':
        error = validateHealthRating(Number(value));
        break;
      case 'dischargeDate':
        if (!value) {
          error = 'Discharge date is required';
        } else if (!isDateValid(value)) {
          error = 'Invalid date format (YYYY-MM-DD)';
        }
        break;
      case 'sickLeaveStartDate':
        if (value && !isDateValid(value)) {
          error = 'Invalid date format (YYYY-MM-DD)';
        } else if (formData.sickLeaveEndDate) {
          error = validateDateRange(value, formData.sickLeaveEndDate);
        }
        break;
      case 'sickLeaveEndDate':
        if (value && !isDateValid(value)) {
          error = 'Invalid date format (YYYY-MM-DD)';
        } else if (formData.sickLeaveStartDate) {
          error = validateDateRange(
            formData.sickLeaveStartDate,
            value
          );
        }
        break;
    }

    setErrors((prev) => ({ ...prev, [fieldName]: error }));
    return !error;
  };

  const clearFields = () => {
    setFormData(initialFormState);
    setErrors({});
    setSubmitCount(0);
  };

  const handleDiagnosisCodesChange = (
    _: React.SyntheticEvent,
    newValue: DiagnosisEntry[]
  ) => {
    const uniqueCodes = Array.from(
      new Set(newValue.map(d => d.code))
    ).map(code => diagnosisCodesAll.find(d => d.code === code)!);
    setFormData((prev) => ({
      ...prev,
      diagnosisCodes: uniqueCodes,
    }));
  };

  const validateForm = () => {
    const formErrors: Record<string, string> = {};

    // Validate base fields
    formErrors.description = validateRequired(
      formData.description,
      'Description'
    );
    formErrors.date = validateRequired(formData.date, 'Date');
    formErrors.specialist = validateRequired(
      formData.specialist,
      'Specialist'
    );
    formErrors.diagnosisCodes =
      formData.diagnosisCodes.length === 0
        ? 'At least one diagnosis code is required'
        : '';

    // Validate entry-specific fields
    if (entryType === 'HealthCheck') {
      formErrors.healthCheckRating = validateHealthRating(
        Number(formData.healthCheckRating)
      );
    }

    if (entryType === 'Hospital') {
      formErrors.dischargeDate = validateRequired(
        formData.dischargeDate,
        'Discharge date'
      );
      formErrors.dischargeCriteria = validateRequired(
        formData.dischargeCriteria,
        'Discharge criteria'
      );
    }

    if (entryType === 'OccupationalHealthcare') {
      formErrors.employerName = validateRequired(
        formData.employerName,
        'Employer name'
      );
    }

    const filteredErrors = Object.fromEntries(
      Object.entries(formErrors).filter(([_, value]) => value)
    );

    setErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setSubmitCount((prev) => prev + 1);

    if (!validateForm()) {
      return;
    }

    const baseEntryObj: Omit<BaseEntry, 'id'> = {
      description: formData.description,
      date: formData.date,
      specialist: formData.specialist,
      diagnosisCodes:
        formData.diagnosisCodes.length > 0
          ? formData.diagnosisCodes.map(d => d.code)
          : undefined,
    };

    let newEntry: NewEntryFormValues;

    switch (entryType) {
      case 'Hospital':
        newEntry = {
          ...baseEntryObj,
          type: 'Hospital',
          discharge: {
            date: formData.dischargeDate,
            criteria: formData.dischargeCriteria,
          },
        };
        break;
      case 'OccupationalHealthcare':
        newEntry = {
          ...baseEntryObj,
          type: 'OccupationalHealthcare',
          employerName: formData.employerName,
          sickLeave:
            formData.sickLeaveStartDate && formData.sickLeaveEndDate
              ? {
                  startDate: formData.sickLeaveStartDate,
                  endDate: formData.sickLeaveEndDate,
                }
              : undefined,
        };
        break;
      case 'HealthCheck':
        newEntry = {
          ...baseEntryObj,
          type: 'HealthCheck',
          healthCheckRating: Number(formData.healthCheckRating),
        };
        break;
      default:
        throw new Error(`Invalid entry type: ${entryType}`);
    }

    await onAddEntry(newEntry);
    clearFields();
    onClose?.();
  };

  const renderEntryTypeFields = () => {
    switch (entryType) {
      case 'Hospital':
        return (
          <>
            <TextField
              name='dischargeDate'
              label='Discharge date'
              value={formData.dischargeDate}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!errors.dischargeDate}
              helperText={
                errors.dischargeDate ||
                'Date when the patient was discharged'
              }
              fullWidth
              margin='normal'
              type='date'
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              name='dischargeCriteria'
              label='Discharge criteria'
              value={formData.dischargeCriteria}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!errors.dischargeCriteria}
              helperText={
                errors.dischargeCriteria || 'Criteria for discharge'
              }
              fullWidth
              margin='normal'
              required
            />
          </>
        );
      case 'OccupationalHealthcare':
        return (
          <>
            <TextField
              name='employerName'
              label='Employer Name'
              value={formData.employerName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!errors.employerName}
              helperText={
                errors.employerName || 'Name of the employer'
              }
              fullWidth
              margin='normal'
              required
            />
            <TextField
              name='sickLeaveStartDate'
              label='Sick leave start date'
              value={formData.sickLeaveStartDate}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!errors.sickLeaveStartDate}
              helperText={
                errors.sickLeaveStartDate ||
                'Start date of sick leave (optional)'
              }
              fullWidth
              margin='normal'
              type='date'
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              name='sickLeaveEndDate'
              label='Sick leave end date'
              value={formData.sickLeaveEndDate}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!errors.sickLeaveEndDate}
              helperText={
                errors.sickLeaveEndDate ||
                'End date of sick leave (optional)'
              }
              fullWidth
              margin='normal'
              type='date'
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </>
        );
      case 'HealthCheck':
        return (
          <TextField
            name='healthCheckRating'
            label='Healthcheck rating'
            value={formData.healthCheckRating}
            onChange={handleChange}
            onBlur={handleBlur}
            error={!!errors.healthCheckRating}
            helperText={
              errors.healthCheckRating ||
              'Rating from 0 (healthy) to 3 (critical risk)'
            }
            fullWidth
            margin='normal'
            type='number'
            required
            slotProps={{
              htmlInput: {
                min: 0,
                max: 3,
                inputMode: 'numeric',
                pattern: '[0-3]'
              }
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: '40%',
            minWidth: 400,
            p: 2,
            overflow: 'auto',
          }
        }
      }}
    >
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 1.5,
          mb: 2,
          px: 2,
          borderRadius: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <AddIcon
          fontSize='small'
          sx={{ mt: 0.5 }}
        />
        <Typography variant='h6'>Add New Entry</Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        <Box
          component='form'
          id='entry-form'
          onSubmit={handleSubmit}
          sx={{
            pt: 2,
            '& .MuiTextField-root': {
              mb: 2,
            },
          }}
        >
          {loading && (
            <Alert
              severity='info'
              icon={<CircularProgress size={20} />}
              sx={{ mb: 3 }}
              aria-live='polite'
            >
              Saving entry data...
            </Alert>
          )}
          {error && (
            <Alert
              severity='error'
              sx={{ mb: 3 }}
              role='alert'
              aria-live='polite'
            >
              <Typography
                variant='subtitle1'
                component='strong'
              >
                Submission error
              </Typography>
              <p>{error}</p>
            </Alert>
          )}
          {submitCount > 0 && Object.keys(errors).length > 0 && (
            <Alert
              severity='error'
              sx={{ mb: 3 }}
              role='alert'
              aria-live='polite'
            >
              <Typography
                variant='subtitle1'
                component='strong'
              >
                Fix these errors:
              </Typography>
              <ul>
                {Object.entries(errors)
                  .filter(([_, error]) => error)
                  .map(([field, error]) => (
                    <li key={field}>{error}</li>
                  ))}
              </ul>
            </Alert>
          )}

          <Typography
            variant='h5'
            component='h2'
            gutterBottom
          >
            New entry
          </Typography>

          <FormControl
            fullWidth
            margin='normal'
          >
            <InputLabel id='entry-type-label'>Entry Type</InputLabel>
            <Select
              labelId='entry-type-label'
              value={entryType}
              label='Entry Type'
              onChange={(e) =>
                setEntryType(e.target.value as Entry['type'])
              }
              required
            >
              <MenuItem value='HealthCheck'>Health Check</MenuItem>
              <MenuItem value='Hospital'>Hospital</MenuItem>
              <MenuItem value='OccupationalHealthcare'>
                Occupational Healthcare
              </MenuItem>
            </Select>
            <FormHelperText>
              Select the type of entry to add
            </FormHelperText>
          </FormControl>

          <TextField
            name='description'
            label='Description'
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            error={!!errors.description}
            helperText={
              errors.description || 'Brief description of the entry'
            }
            fullWidth
            margin='normal'
            required
            inputRef={firstInputRef}
          />

          <TextField
            name='date'
            label='Date'
            value={formData.date}
            onChange={handleChange}
            onBlur={handleBlur}
            error={!!errors.date}
            helperText={errors.date || 'Date of the entry'}
            fullWidth
            margin='normal'
            type='date'
            required
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />

          <TextField
            name='specialist'
            label='Specialist'
            value={formData.specialist}
            onChange={handleChange}
            onBlur={handleBlur}
            error={!!errors.specialist}
            helperText={errors.specialist || 'Name of the specialist'}
            fullWidth
            margin='normal'
            required
          />

          <Autocomplete
            multiple
            options={diagnosisCodesAll}
            value={formData.diagnosisCodes}
            onChange={handleDiagnosisCodesChange}
            getOptionLabel={(option) => `${option.code} - ${option.name}`}
            isOptionEqualToValue={(option, value) => option.code === value.code}
            filterOptions={(options, { inputValue }) =>
              options.filter(option =>
                option.code.toLowerCase().includes(inputValue.toLowerCase()) ||
                option.name.toLowerCase().includes(inputValue.toLowerCase())
              )
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Diagnosis codes"
                error={!!errors.diagnosisCodes}
                helperText={
                  errors.diagnosisCodes ||
                  'Search and select one or more diagnosis codes'
                }
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.code}
                  label={`${option.code} - ${option.name}`}
                  size="small"
                />
              ))
            }
            fullWidth
            sx={{ mb: 2 }}
          />

          {renderEntryTypeFields()}

          <div
            id='a11y-announcements'
            aria-live='polite'
            aria-atomic='true'
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: 0,
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0,0,0,0)',
              border: 0,
            }}
          />
        </Box>
      </Box>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
        }}
      >
        <Button
          color='secondary'
          variant='outlined'
          onClick={() => {
            clearFields();
            onClose?.();
          }}
          sx={{ mr: 2 }}
        >
          Cancel
        </Button>
        <Button
          variant='contained'
          type='submit'
          form='entry-form'
          disabled={loading}
          aria-label={loading ? 'Adding entry' : 'Add entry'}
          sx={{
            minWidth: 100,
            position: 'relative',
          }}
        >
          {loading ? (
            <>
              <CircularProgress
                size={24}
                sx={{
                  position: 'absolute',
                  left: '50%',
                  marginLeft: '-12px',
                }}
              />
              <span style={{ opacity: 0 }}>Add</span>
            </>
          ) : (
            'Add'
          )}
        </Button>
      </Box>
    </Drawer>
  );
};

export default React.memo(AddEntryForm);
