import { useRef, useEffect } from 'react';
import { useFormik } from 'formik';
import type { FormikHelpers } from 'formik';
import { useNotification } from '../../services/notificationService';
import {
  TextField,
  MenuItem,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Typography
} from '@mui/material';
import { validateSSN } from '../../utils';
import { PatientFormValues, Gender } from '../../types';
import { isDateValid } from '../../utils/dateUtils';

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
  deathDate?: string;
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
      deathDate: initialValues?.deathDate || '',
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

      if (values.deathDate && values.deathDate.trim() !== '') {
        if (!isDateValid(values.deathDate)) {
          errors.deathDate = 'Invalid date format (use YYYY-MM-DD)';
        } else if (new Date(values.deathDate) <= new Date(values.dateOfBirth)) {
          errors.deathDate = 'Death date must be after birth date';
        }
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
          deathDate: values.deathDate?.trim() ? values.deathDate.trim() : null,
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
  const nameRef = useRef<HTMLInputElement>(null);
  const ssnRef = useRef<HTMLInputElement>(null);
  const dobRef = useRef<HTMLInputElement>(null);
  const occupationRef = useRef<HTMLInputElement>(null);
  const genderRef = useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLDivElement>;

  const fieldOrder = ['name', 'ssn', 'dateOfBirth', 'occupation', 'gender'];

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      handleNextField(e.currentTarget.id);
    }
  };

  const handleNextField = (currentId: string) => {
    const currentIndex = fieldOrder.indexOf(currentId);
    if (currentIndex === -1) return;

    // Small delay to allow current field to process Enter key
    setTimeout(() => {
      if (currentIndex === fieldOrder.length - 1) {
        // Submit form if we're on last field
        formik.handleSubmit();
        return;
      }

      // Get the next field in sequence
      const nextField = fieldOrder[currentIndex + 1];
      const refs: Record<string, React.RefObject<HTMLElement> | React.MutableRefObject<HTMLElement>> = {
        name: nameRef,
        ssn: ssnRef,
        dateOfBirth: dobRef,
        occupation: occupationRef,
        gender: genderRef
      };

      const nextRef = refs[nextField];
      if (nextRef?.current) {
        // Special handling for select components
        if (nextField === 'gender') {
          const input = nextRef.current.querySelector('input');
          input?.focus();
        } else {
          nextRef.current.focus();
        }
      }
    }, 10);
  };

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
          inputRef={nameRef}
          onKeyDown={handleInputKeyDown}
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
          inputRef={ssnRef}
          onKeyDown={handleInputKeyDown}
          error={formik.touched.ssn && Boolean(formik.errors.ssn)}
          helperText={
            (formik.touched.ssn && formik.errors.ssn) ||
            'Format: 123-45-7890 (3 digits, hyphen, 2 digits, hyphen, 4 digits)'
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
          inputRef={dobRef}
          onKeyDown={handleInputKeyDown}
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
          inputRef={occupationRef}
          onKeyDown={handleInputKeyDown}
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

        <TextField
          select
          label="Gender"
          fullWidth
          id="gender"
          {...formik.getFieldProps('gender')}
          ref={genderRef}
          onKeyDown={handleInputKeyDown}
          error={formik.touched.gender && Boolean(formik.errors.gender)}
          helperText={formik.touched.gender && formik.errors.gender}
          sx={{ mb: 3 }}
        >
          {genderOptions.map((option) => (
            <MenuItem
              key={option.label}
              value={option.value}
              role="option"
            >
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label='Death Date (optional)'
          fullWidth
          id='deathDate'
          type='date'
          {...formik.getFieldProps('deathDate')}
          error={
            formik.touched.deathDate &&
            Boolean(formik.errors.deathDate)
          }
          helperText={
            formik.touched.deathDate && formik.errors.deathDate
          }
          sx={{ mb: 3, mt: 3 }}
          slotProps={{
            input: {
              sx: {
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
            },
            htmlInput: {
              'aria-describedby':
                formik.touched.deathDate &&
                formik.errors.deathDate
                  ? 'death-date-error'
                  : undefined,
              'aria-invalid':
                (formik.touched.deathDate &&
                  !!formik.errors.deathDate) ||
                undefined,
            },
            inputLabel: { shrink: true },
            formHelperText: {
              id: 'death-date-error',
              tabIndex: -1,
            },
          }}
        />

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
            disabled={loading || !formik.isValid}
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
