import {
  Alert,
  Box,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import patientService from '../../services/patients';
import { useParams } from 'react-router-dom';
import {
  Entry,
  NewEntryFormValues,
  Patient,
  BaseEntry,
  DiagnosisEntry,
} from '../../types';

const AddEntryForm: React.FC<{
  setPatient: React.Dispatch<React.SetStateAction<Patient | null>>;
  diagnosisCodesAll: DiagnosisEntry['code'][];
}> = ({ setPatient, diagnosisCodesAll }) => {
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

  const [message, setMessage] = useState<string | null>(null);
  const [entryType, setEntryType] =
    useState<Entry['type']>('HealthCheck');

  const { id } = useParams<{ id: string }>();

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const clearFields = () => {
    setFormData(initialFormState);
    setMessage(null);
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
    if (!id) {
      setMessage('No patient id found');
      return;
    }

    if (entryType === 'HealthCheck') {
      const healthCheckRatingNumber = Number(
        formData.healthCheckRating
      );
      if (
        isNaN(healthCheckRatingNumber) ||
        healthCheckRatingNumber < 0 ||
        healthCheckRatingNumber > 3
      ) {
        setMessage(
          'HealthCheck rating must be a number between 0 and 3'
        );
        return;
      }
    }

    if (entryType === 'Hospital') {
      if (!formData.dischargeDate || !formData.dischargeCriteria) {
        setMessage(
          'Discharge date and criteria are required for Hospital entries'
        );
        return;
      }
    }

    if (entryType === 'OccupationalHealthcare') {
      if (!formData.employerName) {
        setMessage(
          'Employer name is required for Occupational Healthcare entries'
        );
        return;
      }
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

    try {
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
          setMessage(`Invalid entry type: ${entryType}`);
          return;
      }

      await patientService.createNewEntry(id, newEntry);
      const updatedPatient = await patientService.getById(id);
      setPatient(updatedPatient);
      clearFields();
      setMessage('Entry added successfully');
    } catch (error) {
      setMessage('Failed to add entry. Check your input information');
      console.error('Error: ', error);
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
              helperText='Conditions that must be met for discharge.'
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
              fullWidth
              margin='normal'
              type='date'
              InputLabelProps={{ shrink: true }}
              data-name='Sick leave end date'
              helperText='End date of the sick leave period (optional).'
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
      {message && (
        <Alert
          severity={
            message.includes('Failed') ||
            message.includes('Invalid') ||
            message.includes('Wrong') ||
            message.includes('Error') ||
            message.includes('Incorrect')
              ? 'error'
              : 'success'
          }
        >
          {message}
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
            fullWidth
            margin='normal'
            required
            data-name='Description'
            helperText='Provide a brief description of the entry.'
          />

          <TextField
            name='date'
            label='Date'
            value={formData.date}
            onChange={handleChange}
            fullWidth
            margin='normal'
            type='date'
            required
            InputLabelProps={{ shrink: true }}
            data-name='Date'
            helperText='Select the date of the entry.'
          />

          <TextField
            name='specialist'
            label='Specialist'
            value={formData.specialist}
            onChange={handleChange}
            fullWidth
            margin='normal'
            required
            data-name='Specialist'
            helperText='Name of the specialist responsible.'
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

      <Grid
        container
        justifyContent='space-between'
      >
        <Grid item>
          <Button
            color='error'
            variant='contained'
            type='button'
            onClick={clearFields}
          >
            Cancel
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant='contained'
            sx={{ backgroundColor: 'lightgray', color: 'black' }}
            type='submit'
          >
            Add
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AddEntryForm;
