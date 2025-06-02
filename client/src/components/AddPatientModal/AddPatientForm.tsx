import { useState, SyntheticEvent } from "react";
import { TextField, InputLabel, MenuItem, Select, Grid, Button, SelectChangeEvent } from '@mui/material';
import { isDateValid, isSSNValid } from '../../utils';

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

  const onGenderChange = (event: SelectChangeEvent<string>) => {
    event.preventDefault();
    if ( typeof event.target.value === "string") {
      const value = event.target.value;
      const gender = Object.values(Gender).find(g => g.toString() === value);
      if (gender) {
        setGender(gender);
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
    
    if (!ssn.trim()) {
      newErrors.ssn = 'SSN is required';
    } else if (!isSSNValid(ssn)) {
      newErrors.ssn = 'SSN must be in format XXX-XX-XXXX';
    }
    
    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else if (!isDateValid(dateOfBirth)) {
      newErrors.dateOfBirth = 'Invalid date format (use YYYY-MM-DD)';
    } else if (new Date(dateOfBirth) > new Date()) {
      newErrors.dateOfBirth = 'Date cannot be in the future';
    }
    
    if (!occupation.trim()) {
      newErrors.occupation = 'Occupation is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addPatient = (event: SyntheticEvent) => {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    onSubmit({
      name: name.trim(),
      occupation: occupation.trim(),
      ssn: ssn.trim(),
      dateOfBirth,
      gender
    });
  };

  return (
    <div>
      <form onSubmit={addPatient}>
        <TextField
          label="Name"
          fullWidth 
          value={name}
          onChange={({ target }) => setName(target.value)}
          error={!!errors.name}
          helperText={errors.name}
        />
        <TextField
          label="Social security number"
          fullWidth
          value={ssn}
          onChange={({ target }) => setSsn(target.value)}
          error={!!errors.ssn}
          helperText={errors.ssn}
        />
        <TextField
          label="Date of birth"
          placeholder="YYYY-MM-DD"
          fullWidth
          value={dateOfBirth}
          onChange={({ target }) => setDateOfBirth(target.value)}
          type='date'
          InputLabelProps={{ shrink: true }}
          error={!!errors.dateOfBirth}
          helperText={errors.dateOfBirth}
        />
        <TextField
          label="Occupation"
          fullWidth
          value={occupation}
          onChange={({ target }) => setOccupation(target.value)}
          error={!!errors.occupation}
          helperText={errors.occupation}
        />

        <InputLabel style={{ marginTop: 20 }}>Gender</InputLabel>
        <Select
          label="Gender"
          fullWidth
          value={gender}
          onChange={onGenderChange}
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
