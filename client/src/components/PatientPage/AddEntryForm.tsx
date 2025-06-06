import {
  Alert,
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import {
  Entry,
  NewEntryFormValues,
  BaseEntry,
  DiagnosisEntry,
} from '../../types';
import { isDateValid, validateDateRange, validateHealthRating, validateRequired } from '../../utils';

interface Props {
  onAddEntry: (values: NewEntryFormValues) => void;
  error: string | undefined;
  loading: boolean;
  diagnosisCodesAll: DiagnosisEntry['code'][];
}

const AddEntryForm: React.FC<Props> = ({ onAddEntry, error, loading, diagnosisCodesAll }) => {
  const initialFormState = {
    description: '',
    date: '',
    specialist: '',
    diagnosisCodes: [] as string[],

    healthCheckRating: 0,

    dischargeDate: '',
    dischargeCriteria: '',

    employerName: '',
    sickLeaveStartDate: '',
    sickLeaveEndDate: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [entryType, setEntryType] =
    useState<Entry['type']>('HealthCheck');

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({...prev, [name]: ''}));
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
        error = validateRequired(value, fieldName.charAt(0).toUpperCase() + fieldName.slice(1));
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
          // Validate range when both dates are present
          error = validateDateRange(value, formData.sickLeaveEndDate);
        }
        break;
      case 'sickLeaveEndDate':
        if (value && !isDateValid(value)) {
          error = 'Invalid date format (YYYY-MM-DD)';
        } else if (formData.sickLeaveStartDate) {
          // Always validate range against start date
          error = validateDateRange(formData.sickLeaveStartDate, value);
        }
        break;
        
    }
    
    setErrors(prev => ({...prev, [fieldName]: error}));
    return !error;
  };

  const clearFields = () => {
    setFormData(initialFormState);
  };

  const handleDiagnosisCodesChange = (
    event: SelectChangeEvent<string[]>
  ) => {
    setFormData((prev) => ({
      ...prev,
      diagnosisCodes: event.target.value as string[],
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    // Form-wide validation before submission
    const formErrors: Record<string, string> = {};
    
    // Validate base fields
    formErrors.description = validateRequired(formData.description, 'Description');
    formErrors.date = validateRequired(formData.date, 'Date');
    formErrors.specialist = validateRequired(formData.specialist, 'Specialist');
    
    // Validate entry-specific fields
    if (entryType === 'HealthCheck') {
      formErrors.healthCheckRating = validateHealthRating(Number(formData.healthCheckRating));
    }
    
    if (entryType === 'Hospital') {
      formErrors.dischargeDate = validateRequired(formData.dischargeDate, 'Discharge date');
      formErrors.dischargeCriteria = validateRequired(formData.dischargeCriteria, 'Discharge criteria');
    }
    
    if (entryType === 'OccupationalHealthcare') {
      formErrors.employerName = validateRequired(formData.employerName, 'Employer name');
    }
    
    // Filter out empty errors
    const filteredErrors = Object.fromEntries(
      Object.entries(formErrors).filter(([_, value]) => value)
    );
    
    if (Object.keys(filteredErrors).length > 0) {
      setErrors(filteredErrors);
      return;
    }

    const diagnosisCodesArray =
      formData.diagnosisCodes.length > 0
        ? formData.diagnosisCodes
        : undefined;

    const baseEntryObj: Omit<BaseEntry, 'id'> = {
      description: formData.description,
      date: formData.date,
      specialist: formData.specialist,
      diagnosisCodes: diagnosisCodesArray,
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

    onAddEntry(newEntry);
    clearFields();
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
              fullWidth
              margin='normal'
              type='date'
              InputLabelProps={{ shrink: true }}
              required
              data-name='Discharge date'
              helperText='Date when the patient was discharged from the hospital.'
            />

            <TextField
              name='dischargeCriteria'
              label='Discharge criteria'
              value={formData.dischargeCriteria}
              onChange={handleChange}
              fullWidth
              margin='normal'
              required
              data-name='Discharge criteria'
              helperText='Criteria for discharge.'
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
              fullWidth
              margin='normal'
              required
              data-name='Employer Name'
              helperText='Name of the employer related to this healthcare entry.'
            />

            <TextField
              name='sickLeaveStartDate'
              label='Sick leave start date'
              value={formData.sickLeaveStartDate}
              onChange={handleChange}
              fullWidth
              margin='normal'
              type='date'
              InputLabelProps={{ shrink: true }}
              data-name='Sick leave start date'
              helperText='Start date of the sick leave period (optional).'
            />

            <TextField
              name='sickLeaveEndDate'
              label='Sick leave end date'
              value={formData.sickLeaveEndDate}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(errors.sickLeaveEndDate)}
              helperText={errors.sickLeaveEndDate || 'End date of the sick leave period (optional). Must be after start date.'}
              fullWidth
              margin='normal'
              type='date'
              InputLabelProps={{ shrink: true }}
              data-name='Sick leave end date'
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
            fullWidth
            margin='normal'
            type='number'
            required
            inputProps={{ min: 0, max: 3 }}
            data-name='Healthcheck rating'
            helperText='Rating from 0 (healthy) to 3 (critical risk).'
          />
        );
      default:
        return;
    }
  };

  return (
    <Box
      sx={{
        border: '1px dashed',
        p: 1,
        mt: 1,
        borderRadius: 3,
        backgroundColor: '#fafafa',
      }}
      component='form'
      onSubmit={handleSubmit}
    >
      {error && (
        <Alert severity='error'>
          {error}
        </Alert>
      )}

      <div>
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
            id='entry-type'
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
            Please select the type of entry to add
          </FormHelperText>
        </FormControl>

        <Box
          display='flex'
          flexDirection='column'
          gap={1}
        >
          <TextField
            name='description'
            label='Description'
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            error={Boolean(errors.description)}
            helperText={errors.description || 'Provide a brief description of the entry.'}
            fullWidth
            margin='normal'
            required
            data-name='Description'
          />

          <TextField
            name='date'
            label='Date'
            value={formData.date}
            onChange={handleChange}
            onBlur={handleBlur}
            error={Boolean(errors.date)}
            helperText={errors.date || 'Select the date of the entry.'}
            fullWidth
            margin='normal'
            type='date'
            required
            InputLabelProps={{ shrink: true }}
            data-name='Date'
          />

          <TextField
            name='specialist'
            label='Specialist'
            value={formData.specialist}
            onChange={handleChange}
            onBlur={handleBlur}
            error={Boolean(errors.specialist)}
            helperText={errors.specialist || 'Name of the specialist responsible.'}
            fullWidth
            margin='normal'
            required
            data-name='Specialist'
          />

          <FormControl
            fullWidth
            margin='normal'
          >
            <InputLabel id='diagnosis-codes-label'>
              Diagnoses codes
            </InputLabel>
            <Select
              multiple
              value={formData.diagnosisCodes}
              onChange={handleDiagnosisCodesChange}
              input={<OutlinedInput label='Diagnoses codes' />}
            >
              {diagnosisCodesAll.map((code) => (
                <MenuItem
                  key={code}
                  value={code}
                >
                  {code}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              Select one or more diagnosis codes
            </FormHelperText>
          </FormControl>

          {renderEntryTypeFields()}
        </Box>
      </div>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button
          color='error'
          variant='contained'
          type='button'
          onClick={clearFields}
        >
          Cancel
        </Button>
        <Button
          variant='contained'
          sx={{ backgroundColor: 'lightgray', color: 'black' }}
          type='submit'
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add'}
        </Button>
      </Box>
    </Box>
  );
};

export default AddEntryForm;
