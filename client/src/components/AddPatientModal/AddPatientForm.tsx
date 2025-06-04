import { useState, SyntheticEvent } from "react";
import { TextField, InputLabel, MenuItem, Select, Grid, Button, SelectChangeEvent } from '@mui/material';
import { isDateValid, validateSSN } from '../../utils';

import { PatientFormValues, Gender } from "../../types";

interface Props {
  onCancel: () => void;
  onSubmit: (values: PatientFormValues) => void;
}

interface GenderOption{
  value: Gender;
  label: string;
}

const genderOptions: GenderOption[] = Object.values(Gender).map(v => ({
  value: v, label: v.toString()
}));

const AddPatientForm = ({ onCancel, onSubmit }: Props) => {
  const [name, setName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [ssn, setSsn] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState(Gender.Other);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real-time validation handlers
  const validateName = () => {
    if (!name.trim()) {
      setErrors(prev => ({...prev, name: 'Name is required'}));
    } else if (name.trim().length < 3) {
      setErrors(prev => ({...prev, name: 'Name must be at least 3 characters'}));
    } else {
      setErrors(prev => ({...prev, name: ''}));
    }
  };

  const validateSsn = () => {
    if (!ssn.trim()) {
      setErrors(prev => ({...prev, ssn: 'SSN is required'}));
    } else {
      const errorMessage = validateSSN(ssn);
      setErrors(prev => ({...prev, ssn: errorMessage}));
    }
  };

  const validateDateOfBirth = () => {
    if (!dateOfBirth) {
      setErrors(prev => ({...prev, dateOfBirth: 'Date of birth is required'}));
    } else if (!isDateValid(dateOfBirth)) {
      setErrors(prev => ({...prev, dateOfBirth: 'Invalid date format (use YYYY-MM-DD)'}));
    } else if (new Date(dateOfBirth) > new Date()) {
      setErrors(prev => ({...prev, dateOfBirth: 'Date cannot be in the future'}));
    } else {
      setErrors(prev => ({...prev, dateOfBirth: ''}));
    }
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
      }
    }
  };

const validateForm = () => {
  // Create a copy of current errors
  const newErrors: Record<string, string> = { ...errors };
  
  // Validate each field and update newErrors
  if (!name.trim()) {
    newErrors.name = 'Name is required';
  } else if (name.trim().length < 3) {
    newErrors.name = 'Name must be at least 3 characters';
  } else {
    newErrors.name = '';
  }

    if (!ssn.trim()) {
      newErrors.ssn = 'SSN is required';
    } else {
      newErrors.ssn = validateSSN(ssn);
    }

  if (!dateOfBirth) {
    newErrors.dateOfBirth = 'Date of birth is required';
  } else if (!isDateValid(dateOfBirth)) {
    newErrors.dateOfBirth = 'Invalid date format (use YYYY-MM-DD)';
  } else if (new Date(dateOfBirth) > new Date()) {
    newErrors.dateOfBirth = 'Date cannot be in the future';
  } else {
    newErrors.dateOfBirth = '';
  }

  if (!occupation.trim()) {
    newErrors.occupation = 'Occupation is required';
  } else {
    newErrors.occupation = '';
  }

  // Update state with all errors at once
  setErrors(newErrors);
  
  // Return validation result
  return Object.values(newErrors).every(error => error === '');
};

const addPatient = (event: SyntheticEvent) => {
  event.preventDefault();
  
  // First validate all fields
  const isValid = validateForm();
  
  // Only submit if valid
  if (isValid) {
    onSubmit({
      name: name.trim(),
      occupation: occupation.trim(),
      ssn: ssn.trim(),
      dateOfBirth,
      gender
    });
  }
};

  return (
    <div>
      <form onSubmit={addPatient}>
        <TextField
          label="Name"
          fullWidth 
          value={name}
          onChange={({ target }) => {
            setName(target.value);
            validateName();
          }}
          onBlur={validateName}
          error={!!errors.name}
          helperText={errors.name}
        />
        <TextField
          label="Social security number"
          fullWidth
          value={ssn}
          onChange={({ target }) => {
            setSsn(target.value);
            validateSsn();
          }}
          onBlur={validateSsn}
          error={!!errors.ssn}
          helperText={errors.ssn}
        />
        <TextField
          label="Date of birth"
          placeholder="YYYY-MM-DD"
          fullWidth
          value={dateOfBirth}
          onChange={({ target }) => {
            setDateOfBirth(target.value);
            validateDateOfBirth();
          }}
          onBlur={validateDateOfBirth}
          type='date'
          InputLabelProps={{ shrink: true }}
          error={!!errors.dateOfBirth}
          helperText={errors.dateOfBirth}
        />
        <TextField
          label="Occupation"
          fullWidth
          value={occupation}
          onChange={({ target }) => {
            setOccupation(target.value);
            validateOccupation();
          }}
          onBlur={validateOccupation}
          error={!!errors.occupation}
          helperText={errors.occupation}
        />

<InputLabel 
  id="gender-label" 
  style={{ marginTop: 20 }}
>
  Gender
</InputLabel>
<Select
  labelId="gender-label"
  label="Gender"
  fullWidth
  value={gender}
  onChange={onGenderChange}
  inputProps={{ "data-testid": "gender-select" }}
>
        {genderOptions.map(option =>
          <MenuItem
            key={option.label}
            value={option.value}
          >
            {option.label
          }</MenuItem>
        )}
        </Select>

        <Grid>
          <Grid item>
            <Button
              color="secondary"
              variant="contained"
              style={{ float: "left" }}
              type="button"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </Grid>
          <Grid item>
            <Button
              style={{
                float: "right",
              }}
              type="submit"
              variant="contained"
            >
              Add
            </Button>
          </Grid>
        </Grid>
      </form>
    </div>
  );
};

export default AddPatientForm;
