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
import React, { useState, useEffect, useRef } from 'react';
import {
  Entry,
  NewEntryFormValues,
  BaseEntry,
  DiagnosisEntry,
} from '../../types';
import { isDateValid, validateDateRange, validateHealthRating, validateRequired } from '../../utils';
import { useTheme } from '@mui/material/styles';

interface Props {
  onAddEntry: (values: NewEntryFormValues) => void;
  error: string | undefined;
  loading: boolean;
  diagnosisCodesAll: DiagnosisEntry['code'][];
  onClose?: () => void;
  onEntryAdded?: () => void; // Callback when entry is added
}

const AddEntryForm: React.FC<Props> = ({
  onAddEntry,
  error,
  loading,
  diagnosisCodesAll,
  onClose,
  onEntryAdded
}) => {
  const theme = useTheme();
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
  const errorRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (Object.values(errors).some(e => e)) {
      // Announce errors to screen readers
      const errorMessages = Object.values(errors).filter(e => e).join('. ');
      const liveRegion = document.getElementById('a11y-announcements');
      if (liveRegion) {
        liveRegion.textContent = `Form errors: ${errorMessages}`;
      }

      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const input = document.getElementById(`${firstErrorField}-input`);
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
    const selectedCodes = event.target.value as string[];
    // Filter out duplicates
    const uniqueCodes = Array.from(new Set(selectedCodes));
    setFormData((prev) => ({
      ...prev,
      diagnosisCodes: uniqueCodes,
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
    if (onEntryAdded) {
      onEntryAdded();
    }
    if (onClose) {
      onClose();
    }
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
              error={Boolean(errors.dischargeDate)}
              helperText={errors.dischargeDate || 'Date when the patient was discharged from the hospital.'}
              fullWidth
              margin='normal'
              type='date'
              required
              data-name='Discharge date'
              slotProps={{
                input: {
                  style: { color: theme.palette.text.primary }
                },
                inputLabel: { shrink: true },

                formHelperText: {
                  id: 'dischargeDate-error',
                  tabIndex: -1
                }
              }} />
            <TextField
              name='dischargeCriteria'
              label='Discharge criteria'
              value={formData.dischargeCriteria}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(errors.dischargeCriteria)}
              helperText={errors.dischargeCriteria || 'Criteria for discharge.'}
              fullWidth
              margin='normal'
              required
              data-name='Discharge criteria'
              slotProps={{
                input: {
                  style: { color: theme.palette.text.primary }
                },
                formHelperText: {
                  id: 'dischargeCriteria-error',
                  tabIndex: -1
                }
              }}
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
              error={Boolean(errors.employerName)}
              helperText={errors.employerName || 'Name of the employer related to this healthcare entry.'}
              fullWidth
              margin='normal'
              required
              data-name='Employer Name'
              slotProps={{
                input: {
                  style: { color: theme.palette.text.primary }
                },
                formHelperText: {
                  id: 'employerName-error',
                  tabIndex: -1
                }
              }}
            />
            <TextField
              name='sickLeaveStartDate'
              label='Sick leave start date'
              value={formData.sickLeaveStartDate}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(errors.sickLeaveStartDate)}
              helperText={errors.sickLeaveStartDate || 'Start date of the sick leave period (optional).'}
              fullWidth
              margin='normal'
              type='date'
              data-name='Sick leave start date'
              slotProps={{
                input: {
                  style: { color: theme.palette.text.primary }
                },
                inputLabel: { shrink: true },

                formHelperText: {
                  id: 'sickLeaveStartDate-error',
                  tabIndex: -1
                }
              }} />
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
              data-name='Sick leave end date'
              slotProps={{
                input: {
                  style: { color: theme.palette.text.primary }
                },
                inputLabel: { shrink: true },

                formHelperText: {
                  id: 'sickLeaveEndDate-error',
                  tabIndex: -1
                }
              }} />
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
            error={Boolean(errors.healthCheckRating)}
            helperText={errors.healthCheckRating || 'Rating from 0 (healthy) to 3 (critical risk).'}
            fullWidth
            margin='normal'
            type='number'
            required
            data-name='Healthcheck rating'
            slotProps={{
              input: {
                style: { color: theme.palette.text.primary }
              },
              htmlInput: { min: 0, max: 3 },

              formHelperText: {
                id: 'healthCheckRating-error',
                tabIndex: -1
              }
            }} />
        );
      default:
        return;
    }
  };

  return (
    <Box
      sx={{
        border: `1px dashed ${theme.palette.divider}`,
        p: 1,
        mt: 1,
        borderRadius: 3,
        backgroundColor: theme.palette.background.paper,
        // Drawer-specific styles
        maxWidth: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        '& .MuiFormControl-marginNormal': {
          marginTop: 0,
          marginBottom: theme.spacing(1),
        },
        [theme.breakpoints.down('sm')]: {
          padding: theme.spacing(1),
        },
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
          color={theme.palette.text.primary}
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
            slotProps={{
              input: {
                id: 'description-input',
                'aria-required': true,
                'aria-describedby': errors.description ? 'description-error' : 'description-helper',
                style: { color: theme.palette.text.primary },
                ref: firstInputRef
              },

              htmlInput: {
                'aria-describedby': 'description-helper description-error',
                'aria-invalid': errors.description ? 'true' : 'false'
              },

              formHelperText: {
                id: 'description-helper',
                ref: errorRef,
                tabIndex: -1
              }
            }} />

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
            data-name='Date'
            slotProps={{
              input: {
                id: 'date-input',
                'aria-required': true,
                'aria-describedby': errors.date ? 'date-error' : 'date-helper',
                style: { color: theme.palette.text.primary }
              },

              htmlInput: {
                'aria-describedby': 'date-helper date-error',
                'aria-invalid': errors.date ? 'true' : 'false'
              },

              inputLabel: { shrink: true },

              formHelperText: {
                id: 'date-helper',
                tabIndex: -1
              }
            }} />

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
            slotProps={{
              input: {
                id: 'specialist-input',
                'aria-required': true,
                'aria-describedby': errors.specialist ? 'specialist-error' : 'specialist-helper',
                style: { color: theme.palette.text.primary }
              },

              htmlInput: {
                'aria-describedby': 'specialist-helper specialist-error',
                'aria-invalid': errors.specialist ? 'true' : 'false'
              },

              formHelperText: {
                id: 'specialist-helper',
                tabIndex: -1
              }
            }} />

          <FormControl
            fullWidth
            margin='normal'
          >
            <InputLabel id='diagnosis-codes-label' aria-required={false}>
              Diagnoses codes
            </InputLabel>
            <Select
              multiple
              value={formData.diagnosisCodes}
              onChange={handleDiagnosisCodesChange}
              input={<OutlinedInput
                label='Diagnoses codes'
                inputProps={{
                  'aria-label': 'Select diagnosis codes',
                  'aria-describedby': 'diagnosis-codes-helper'
                }}
              />}
              MenuProps={{
                autoFocus: false,
                disableAutoFocusItem: true,
                disableEnforceFocus: true,
              }}
            >
              {diagnosisCodesAll
                .filter((code, index, self) => self.indexOf(code) === index) // Filter out duplicates
                .map(code => {
                  return (
                    <MenuItem
                      key={code}
                      value={code}
                      aria-label={code}
                    >
                      {code}
                    </MenuItem>
                  );
                })}
            </Select>
            <FormHelperText id="diagnosis-codes-helper">
              Select one or more diagnosis codes
            </FormHelperText>
          </FormControl>

          {renderEntryTypeFields()}

          {/* Hidden region for screen reader announcements */}
          <div
            id="a11y-announcements"
            aria-live="polite"
            aria-atomic="true"
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: 0,
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0,0,0,0)',
              border: 0
            }}
          />
        </Box>
      </div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button
          color='secondary'
          variant='contained'
          type='button'
          onClick={() => {
            clearFields();
            if (onClose) {
              onClose();
            }
          }}
        >
          Cancel
        </Button>
        <Button
          variant='contained'
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            }
          }}
          type='submit'
          disabled={loading}
          aria-label={loading ? 'Adding entry' : 'Add entry'}
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === 'Enter') {
              formRef.current?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
          }}
        >
          {loading ? 'Adding...' : 'Add (Ctrl+Enter)'}
        </Button>
      </Box>
    </Box>
  );
};

export default React.memo(AddEntryForm);
