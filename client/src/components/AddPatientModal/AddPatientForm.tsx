import { useState, SyntheticEvent, useEffect } from "react";
import { TextField, InputLabel, MenuItem, Select, Grid, Button, SelectChangeEvent, CircularProgress, FormHelperText } from '@mui/material';
import { isDateValid } from '../../utils';
import { validateSSN } from '@shared/src/utils/validation';
import { PatientFormValues, Gender } from "../../types";

interface Props {
  onCancel: () => void;
  onSubmit: (values: PatientFormValues) => void;
  loading?: boolean;
  serverErrors?: Record<string, string>;
}

interface GenderOption{
  value: Gender;
  label: string;
}

const genderOptions: GenderOption[] = Object.values(Gender).map(v => ({
  value: v, label: v.toString()
}));

const AddPatientForm = ({ onCancel, onSubmit, loading, serverErrors }: Props) => {
  const [name, setName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [ssn, setSsn] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [gender, setGender] = useState(Gender.Other);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState(''); // For form-level errors

  useEffect(() => {
    if (serverErrors) {
      if (serverErrors.form) {
        setFormError(serverErrors.form);
      }
      
      const fieldErrors = Object.keys(serverErrors).reduce((acc, key) => {
        if (key !== 'form') {
          acc[key] = serverErrors[key];
        }
        return acc;
      }, {} as Record<string, string>);
      
      setErrors(prev => ({ ...prev, ...fieldErrors }));
    }
  }, [serverErrors]);

  const validateName = () => {
    if (!name.trim()) {
      setErrors(prev => ({...prev, name: 'Name is required'}));
    } else if (name.trim().length < 3) {
      setErrors(prev => ({...prev, name: 'Name must be at least 3 characters'}));
    } else {
      setErrors(prev => ({...prev, name: ''}));
    }
  };

  const validateGender = () => {
    if (!gender) {
      setErrors(prev => ({...prev, gender: 'Gender is required'}));
    } else if (!Object.values(Gender).includes(gender)) {
      setErrors(prev => ({...prev, gender: 'Invalid gender'}));
    } else {
      setErrors(prev => ({...prev, gender: ''}));
    }
  };

  const validateSsn = () => {
    const trimmedSsn = ssn.trim();
    if (!trimmedSsn) {
      setErrors(prev => ({...prev, ssn: 'SSN is required'}));
    } else {
      const validationResult = validateSSN(trimmedSsn);
      setErrors(prev => ({...prev, ssn: validationResult.message || ''}));
    }
  };

  const validateDateOfBirth = () => {
    if (!dateOfBirth) {
      setErrors(prev => ({...prev, dateOfBirth: 'Date of birth is required'}));
      return;
    }

    if (!isDateValid(dateOfBirth)) {
      setErrors(prev => ({...prev, dateOfBirth: 'Invalid date format (use YYYY-MM-DD)'}));
      return;
    }

    const date = new Date(dateOfBirth);
    const today = new Date();

    if (date > today) {
      setErrors(prev => ({...prev, dateOfBirth: 'Date cannot be in the future'}));
      return;
    }

    const year = date.getFullYear();
    const currentYear = today.getFullYear();
    if (year < 1900 || year > currentYear) {
      setErrors(prev => ({...prev, dateOfBirth: `Year must be between 1900 and ${currentYear}`}));
      return;
    }

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const lastDayOfMonth = new Date(year, month, 0).getDate();

    if (day > lastDayOfMonth) {
      setErrors(prev => ({...prev, dateOfBirth: `Invalid date: ${month} has only ${lastDayOfMonth} days`}));
      return;
    }

    setErrors(prev => ({...prev, dateOfBirth: ''}));
  };

  const validateDeathDate = () => {
    if (!deathDate) {
      setErrors(prev => ({ ...prev, deathDate: '' }));
      return;
    }

    if (!isDateValid(deathDate)) {
      setErrors(prev => ({...prev, deathDate: 'Invalid date format (use YYYY-MM-DD)'}));
      return;
    }

    const death = new Date(deathDate);
    const birth = new Date(dateOfBirth);
    
    if (death < birth) {
      setErrors(prev => ({...prev, deathDate: 'Death date must be after birth date'}));
      return;
    }

    const today = new Date();
    if (death > today) {
      setErrors(prev => ({...prev, deathDate: 'Death date cannot be in the future'}));
      return;
    }

    setErrors(prev => ({...prev, deathDate: ''}));
  };

  const validateOccupation = () => {  
    if (!occupation.trim()) {  
      setErrors(prev => ({...prev, occupation: 'Occupation is required'}));  
    } else {  
      setErrors(prev => ({...prev, occupation: ''}));  
    }  
  };  

  const onGenderChange = (event: SelectChangeEvent<string>) => {
    event.preventDefault();
    if (typeof event.target.value === "string") {
      const value = event.target.value;
      const gender = Object.values(Gender).find(g => g.toString() === value);
      if (gender) {
        setGender(gender);
        setErrors(prev => ({ ...prev, gender: '' }));
        validateGender();
      }
    }
  };

const validateForm = () => {
  const newErrors: Record<string, string> = {};
  
  if (!name.trim()) {
    newErrors.name = 'Name is required';
  } else if (name.trim().length < 3) {
    newErrors.name = 'Name must be at least 3 characters';
  }

  if (!gender) {
    newErrors.gender = 'Gender is required';
  } else if (!Object.values(Gender).includes(gender)) {
    newErrors.gender = 'Invalid gender';
  }

  const trimmedSsn = ssn.trim();
  if (!trimmedSsn) {
    newErrors.ssn = 'SSN is required';
  } else {
    const validationResult = validateSSN(trimmedSsn);
    if (!validationResult.valid) {
      newErrors.ssn = validationResult.message || 'Invalid SSN';
    }
  }

  if (!dateOfBirth) {
    newErrors.dateOfBirth = 'Date of birth is required';
  } else if (!isDateValid(dateOfBirth)) {
    newErrors.dateOfBirth = 'Invalid date format (use YYYY-MM-DD)';
  } else {
    // Create UTC dates for accurate comparison
    const date = new Date(dateOfBirth + 'T00:00:00Z');
    const todayUTC = new Date();
    todayUTC.setUTCHours(0,0,0,0);
    
    if (date > todayUTC) {
      newErrors.dateOfBirth = 'Date cannot be in the future';
    } else {
      const year = date.getUTCFullYear();
      const currentYear = todayUTC.getUTCFullYear();
      if (year < 1900 || year > currentYear) {
        newErrors.dateOfBirth = `Year must be between 1900 and ${currentYear}`;
      } else {
        const day = date.getUTCDate();
        const month = date.getUTCMonth() + 1;
        const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
        if (day > lastDayOfMonth) {
          newErrors.dateOfBirth = `Invalid date: ${month} has only ${lastDayOfMonth} days`;
        }
      }
    }
  }

  if (!occupation.trim()) {
    newErrors.occupation = 'Occupation is required';
  }

  if (deathDate) {
    const death = new Date(deathDate);
    const birth = new Date(dateOfBirth);
    
    if (death < birth) {
      newErrors.deathDate = 'Death date must be after birth date';
    }
  }

  return {
    isValid: Object.keys(newErrors).length === 0,
    errors: newErrors
  };
};

const addPatient = (event: SyntheticEvent) => {
  event.preventDefault();
  
  setFormError('');
  const { isValid, errors: validationErrors } = validateForm();
  
  setErrors(validationErrors);
  
  if (isValid) {
    onSubmit({
      name: name.trim(),
      occupation: occupation.trim(),
      ssn: ssn.trim(),
      dateOfBirth,
      gender,
      deathDate: deathDate ? deathDate : null
    });
  }
};

  return (
    <div>
      <form onSubmit={addPatient} aria-label="Add new patient form">
        {formError && (
          <div
            role="alert"
            aria-live="assertive"
            style={{
              backgroundColor: '#ffebee',
              color: '#b71c1c',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{formError}</span>
          </div>
        )}
        <TextField
          label="Name"
          fullWidth
          value={name}
          onChange={({ target }) => {
            setName(target.value);
            setErrors(prev => ({ ...prev, name: '' }));
            validateName();
          }}
          onBlur={validateName}
          error={!!errors.name}
          helperText={errors.name || 'Full name (max 100 characters)'}
          sx={{ mb: 3 }}
          slotProps={{
            input: {
              sx: {
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
            },

            htmlInput: {
              ...{ maxLength: 100 },

              ...{
                'aria-required': 'true',
                'aria-describedby': errors.name ? 'name-error' : undefined,
                'aria-invalid': !!errors.name || undefined
              }
            },

            formHelperText: {
              id: 'name-error',
              tabIndex: -1
            }
          }} />
        <TextField
          label="Social security number"
          fullWidth
          value={ssn}
          onChange={({ target }) => {
            setSsn(target.value);
            setErrors(prev => ({ ...prev, ssn: '' }));
            setFormError('');
            validateSsn();
          }}
          onBlur={validateSsn}
          error={!!errors.ssn}
          helperText={errors.ssn || 'Format: XXX-XX-XXXX with valid checksum'}
          sx={{ mb: 3 }}
          slotProps={{
            input: {
              sx: {
                '&.Mui-focused fieldset': {
                  borderColor: errors.ssn ? 'error.main' : 'primary.main',
                },
              },
            },
            htmlInput: {
              'aria-required': 'true',
              'aria-describedby': errors.ssn ? 'ssn-error' : undefined,
              'aria-invalid': !!errors.ssn || undefined
            },
            formHelperText: {
              id: 'ssn-error',
              tabIndex: -1,
              sx: {
                color: errors.ssn ? 'error.main' : 'text.secondary',
                fontWeight: errors.ssn ? 600 : 'normal'
              }
            }
          }}
        />
        <TextField
          label="Date of birth"
          placeholder="YYYY-MM-DD"
          fullWidth
          value={dateOfBirth}
          onChange={({ target }) => {
            setDateOfBirth(target.value);
            setErrors(prev => ({ ...prev, dateOfBirth: '' }));
            validateDateOfBirth();
          }}
          onBlur={validateDateOfBirth}
          type='date'
          error={!!errors.dateOfBirth}
          helperText={errors.dateOfBirth}
          sx={{ mb: 3 }}
          slotProps={{
            input: {
              sx: {
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
            },

            htmlInput: {
              'aria-required': 'true',
              'aria-describedby': errors.dateOfBirth ? 'dob-error' : undefined,
              'aria-invalid': !!errors.dateOfBirth || undefined
            },

            inputLabel: { shrink: true },

            formHelperText: {
              id: 'dob-error',
              tabIndex: -1
            }
          }} />
        <TextField
          label="Date of death (optional)"
          placeholder="YYYY-MM-DD"
          fullWidth
          value={deathDate}
          onChange={({ target }) => {
            setDeathDate(target.value);
            setErrors(prev => ({ ...prev, deathDate: '' }));
            validateDeathDate();
          }}
          onBlur={validateDeathDate}
          type='date'
          error={!!errors.deathDate}
          helperText={errors.deathDate}
          sx={{ mb: 3 }}
          slotProps={{
            input: {
              sx: {
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
            },

            htmlInput: {
              'aria-describedby': errors.deathDate ? 'death-error' : undefined,
              'aria-invalid': !!errors.deathDate || undefined
            },

            inputLabel: { shrink: true },

            formHelperText: {
              id: 'death-error',
              tabIndex: -1
            }
          }} />
        <TextField
          label="Occupation"
          fullWidth
          value={occupation}
          onChange={({ target }) => {
            setOccupation(target.value);
            setErrors(prev => ({ ...prev, occupation: '' }));
            validateOccupation();
          }}
          onBlur={validateOccupation}
          error={!!errors.occupation}
          helperText={errors.occupation || 'Occupation (max 100 characters)'}
          sx={{ mb: 3 }}
          slotProps={{
            input: {
              sx: {
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
            },

            htmlInput: {
              ...{ maxLength: 100 },

              ...{
                'aria-required': 'true',
                'aria-describedby': errors.occupation ? 'occupation-error' : undefined,
                'aria-invalid': !!errors.occupation || undefined
              }
            },

            formHelperText: {
              id: 'occupation-error',
              tabIndex: -1
            }
          }} />

        <div style={{ marginBottom: '24px' }}>
          <InputLabel
            id="gender-label"
            style={{ marginTop: 20, marginBottom: 8 }}
            error={!!errors.gender}
          >
            Gender
          </InputLabel>
          <Select
            labelId="gender-label"
            label="Gender"
            fullWidth
            value={gender}
            onChange={onGenderChange}
            inputProps={{
              "data-testid": "gender-select",
              'aria-required': 'true',
              'role': 'combobox',
              'aria-invalid': !!errors.gender || undefined,
              'aria-describedby': errors.gender ? 'gender-error' : undefined
            }}
            error={!!errors.gender}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: errors.gender ? 'error.main' : 'primary.main',
                },
              },
            }}
          >
            {genderOptions.map(option =>
              <MenuItem
                key={option.label}
                value={option.value}
                role="option"
              >
                {option.label}
              </MenuItem>
            )}
          </Select>
          {errors.gender && (
            <FormHelperText
              error
              id="gender-error"
              tabIndex={-1}
              sx={{
                mt: 1,
                ml: 1,
                color: 'error.main',
                fontWeight: 600
              }}
            >
              {errors.gender}
            </FormHelperText>
          )}
        </div>

        <Grid container justifyContent="space-between" sx={{ mt: 2, gap: 2 }}>  
          <Button  
            color="secondary"  
            variant="contained"  
            type="button"  
            onClick={onCancel}  
            sx={{  
              minWidth: 100,  
              '&:hover': {  
                transform: 'translateY(-2px)',  
                boxShadow: 3,  
              },  
              transition: 'all 0.3s ease',  
            }}  
          >  
            Cancel  
          </Button>  
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              minWidth: 100,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3,
              },
              transition: 'all 0.3s ease',
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Add'}
          </Button>
        </Grid>  
      </form>
    </div>
  );  
};  

export default AddPatientForm;

