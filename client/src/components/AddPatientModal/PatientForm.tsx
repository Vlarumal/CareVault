import { useRef, useEffect } from 'react';
import { useFormik } from 'formik';
import type { FormikHelpers } from 'formik';
import { useNotification } from '../../services/notificationService';
import {
  TextField,
  InputLabel,
  MenuItem,
  Select,
  Grid,
  Button,
  SelectChangeEvent,
  CircularProgress,
  Alert,
  Typography
} from '@mui/material';
import { isDateValid, validateSSN } from '../../utils';
import { PatientFormValues, Gender } from '../../types';

interface Props {
  onCancel: () => void;
  onSubmit: (values: PatientFormValues) => void;
  loading?: boolean;
  initialValues?: PatientFormValues;
  isEdit?: boolean;
}

interface FormValues {
  name: string;
  ssn: string;
  dateOfBirth: string;
  occupation: string;
  gender: Gender;
}

interface GenderOption {
  value: Gender;
  label: string;
}

const genderOptions: GenderOption[] = Object.values(Gender).map(
  (v) => ({
    value: v,
    label: v.toString(),
  })
);

const PatientForm = ({
  onCancel,
  onSubmit,
  loading,
  initialValues,
  isEdit = false,
}: Props) => {
  const { showNotification } = useNotification();
  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues: {
      name: initialValues?.name || '',
      ssn: initialValues?.ssn || '',
      dateOfBirth: initialValues?.dateOfBirth || '',
      occupation: initialValues?.occupation || '',
      gender: initialValues?.gender || Gender.Other,
    },
    validate: (values: FormValues) => {
      const errors: Record<string, string> = {};

      if (!values.name.trim()) {
        errors.name = 'Name is required';
      } else if (values.name.trim().length < 3) {
        errors.name = 'Name must be at least 3 characters';
      }

      if (!values.ssn.trim()) {
        errors.ssn = 'SSN is required';
      } else {
        const ssnError = validateSSN(values.ssn);
        if (ssnError) errors.ssn = ssnError;
      }

      if (!values.dateOfBirth) {
        errors.dateOfBirth = 'Date of birth is required';
      } else if (!isDateValid(values.dateOfBirth)) {
        errors.dateOfBirth = 'Invalid date format (use YYYY-MM-DD)';
      } else if (new Date(values.dateOfBirth) > new Date()) {
        errors.dateOfBirth = 'Date cannot be in the future';
      }

      if (!values.occupation.trim()) {
        errors.occupation = 'Occupation is required';
      }

      return errors;
    },
    onSubmit: async (
      values: FormValues,
      { setSubmitting }: FormikHelpers<FormValues>
    ) => {
      try {
        await onSubmit({
          name: values.name.trim(),
          occupation: values.occupation.trim(),
          ssn: values.ssn.trim(),
          dateOfBirth: values.dateOfBirth,
          gender: values.gender,
        });
        showNotification(
          `Patient ${isEdit ? 'updated' : 'added'} successfully!`,
          'success'
        );
      } catch (error) {
        showNotification(
          'Failed to save patient. Please try again.',
          'error'
        );
      } finally {
        setSubmitting(false);
      }
    },
  });
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (
      errorRef.current &&
      Object.values(formik.errors).some((e) => e)
    ) {
      errorRef.current.focus();
    }
  }, [formik.errors]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (formik.status?.success) {
      timer = setTimeout(() => {
        formik.setStatus(null);
      }, 6000);
    }
    return () => clearTimeout(timer);
  }, [formik.status?.success]);

  const onGenderChange = (event: SelectChangeEvent<string>) => {
    event.preventDefault();
    if (typeof event.target.value === 'string') {
      const value = event.target.value;
      const gender = Object.values(Gender).find(
        (g) => g.toString() === value
      );
      if (gender) {
        formik.setFieldValue('gender', gender);
      }
    }
  };

  return (
    <div>
      {loading && (
        <Alert
          severity="info"
          icon={<CircularProgress size={20} />}
          sx={{ mb: 3 }}
          aria-live="polite"
        >
          Saving patient data...
        </Alert>
      )}
      <form
        onSubmit={formik.handleSubmit}
        aria-label={`${isEdit ? 'Edit' : 'Add'} patient form`}
      >
        {formik.submitCount > 0 && !formik.isValid && (
          <Alert
            severity='error'
            sx={{ mb: 3 }}
            role='alert'
            aria-live="polite"
          >
            <Typography variant="subtitle1" component="strong">Fix these errors:</Typography>
            <ul>
              {Object.entries(formik.errors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        <TextField
          label='Name'
          fullWidth
          id='name'
          {...formik.getFieldProps('name')}
          error={Boolean(formik.errors.name) && (formik.touched.name || formik.submitCount > 0)}
          helperText={(formik.touched.name || formik.submitCount > 0) && formik.errors.name}
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
              'aria-describedby':
                formik.touched.name && formik.errors.name
                  ? 'name-error'
                  : undefined,
              'aria-invalid':
                (formik.touched.name && !!formik.errors.name) ||
                undefined,
            },
            formHelperText: {
              id: 'name-error',
              tabIndex: -1,
            },
          }}
        />
        <TextField
          label='SSN'
          fullWidth
          id='ssn'
          {...formik.getFieldProps('ssn')}
          error={formik.touched.ssn && Boolean(formik.errors.ssn)}
          helperText={
            (formik.touched.ssn && formik.errors.ssn) ||
            'Format: 123456-7890 (6 digits, hyphen, 4 digits)'
          }
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
              'aria-describedby':
                formik.touched.ssn && formik.errors.ssn
                  ? 'ssn-error'
                  : undefined,
              'aria-invalid':
                (formik.touched.ssn && !!formik.errors.ssn) ||
                undefined,
            },
            formHelperText: {
              id: 'ssn-error',
              tabIndex: -1,
            },
          }}
        />
        <TextField
          label='Date of Birth'
          fullWidth
          id='dateOfBirth'
          type='date'
          {...formik.getFieldProps('dateOfBirth')}
          error={
            formik.touched.dateOfBirth &&
            Boolean(formik.errors.dateOfBirth)
          }
          helperText={
            formik.touched.dateOfBirth && formik.errors.dateOfBirth
          }
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
              'aria-describedby':
                formik.touched.dateOfBirth &&
                formik.errors.dateOfBirth
                  ? 'dob-error'
                  : undefined,
              'aria-invalid':
                (formik.touched.dateOfBirth &&
                  !!formik.errors.dateOfBirth) ||
                undefined,
            },
            inputLabel: { shrink: true },
            formHelperText: {
              id: 'dob-error',
              tabIndex: -1,
            },
          }}
        />
        <TextField
          label='Occupation'
          fullWidth
          id='occupation'
          {...formik.getFieldProps('occupation')}
          error={
            formik.touched.occupation &&
            Boolean(formik.errors.occupation)
          }
          helperText={
            formik.touched.occupation && formik.errors.occupation
          }
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
              'aria-describedby':
                formik.touched.occupation && formik.errors.occupation
                  ? 'occupation-error'
                  : undefined,
              'aria-invalid':
                (formik.touched.occupation &&
                  !!formik.errors.occupation) ||
                undefined,
            },
            formHelperText: {
              id: 'occupation-error',
              tabIndex: -1,
            },
          }}
        />

        <InputLabel
          id='gender-label'
          style={{ marginTop: 20 }}
        >
          Gender
        </InputLabel>
        <Select
          labelId='gender-label'
          label='Gender'
          fullWidth
          value={formik.values.gender}
          onChange={onGenderChange}
          inputProps={{
            'data-testid': 'gender-select',
            'aria-required': 'true',
            role: 'combobox',
          }}
        >
          {genderOptions.map((option) => (
            <MenuItem
              key={option.label}
              value={option.value}
              role='option'
            >
              {option.label}
            </MenuItem>
          ))}
        </Select>

        <Grid
          container
          justifyContent='space-between'
          sx={{ mt: 2, gap: 2 }}
        >
          <Button
            color='secondary'
            variant='contained'
            type='button'
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
            type='submit'
            variant='contained'
            disabled={loading}
            onClick={() => formik.handleSubmit()}
            sx={{
              minWidth: 100,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3,
              },
              transition: 'all 0.3s ease',
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
                <span style={{ opacity: 0 }}>
                  {isEdit ? 'Update' : 'Add'}
                </span>
              </>
            ) : isEdit ? (
              'Update'
            ) : (
              'Add'
            )}
          </Button>
        </Grid>
      </form>
    </div>
  );
};

export default PatientForm;
