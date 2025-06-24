import { useState, useEffect } from 'react';
import { PatientFormValues, Gender } from '../types';
import { validateSSN } from '@shared/src/utils/validation';
import { isDateValid } from '../utils/dateUtils';

interface UsePatientFormProps {
  initialValues?: PatientFormValues;
  onSubmit: (values: PatientFormValues) => void;
  serverErrors?: Record<string, string>;
}

interface UsePatientFormReturn {
  formValues: PatientFormValues;
  errors: Record<string, string>;
  formError: string;
  handleChange: <K extends keyof PatientFormValues>(field: K, value: PatientFormValues[K]) => void;
  handleBlur: (field: keyof PatientFormValues) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

const usePatientForm = ({
  initialValues,
  onSubmit,
  serverErrors
}: UsePatientFormProps): UsePatientFormReturn => {
  const [formValues, setFormValues] = useState<PatientFormValues>(initialValues || {
    name: '',
    occupation: '',
    ssn: '',
    dateOfBirth: '',
    gender: Gender.Other,
    deathDate: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

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

  const validateField = (field: keyof PatientFormValues) => {
    const value = formValues[field];
    
    switch (field) {
      case 'name':
        if (typeof value !== 'string' || !value.trim()) return 'Name is required';
        if (value.trim().length < 3) return 'Name must be at least 3 characters';
        return '';
      case 'gender':
        if (!value) return 'Gender is required';
        if (!Object.values(Gender).includes(value as Gender)) return 'Invalid gender';
        return '';
      case 'ssn':
        if (typeof value !== 'string' || !value.trim()) return 'SSN is required';
        const validationResult = validateSSN(value.trim());
        return validationResult.valid ? '' : validationResult.message || 'Invalid SSN';
      case 'dateOfBirth':
        if (typeof value !== 'string' || !value) return 'Date of birth is required';
        if (!isDateValid(value)) return 'Invalid date format (use YYYY-MM-DD)';
        
        const date = new Date(value);
        const today = new Date();
        if (date > today) return 'Date cannot be in the future';
        
        const year = date.getFullYear();
        const currentYear = today.getFullYear();
        if (year < 1900 || year > currentYear) return `Year must be between 1900 and ${currentYear}`;
        
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const lastDayOfMonth = new Date(year, month, 0).getDate();
        if (day > lastDayOfMonth) return `Invalid date: ${month} has only ${lastDayOfMonth} days`;
        return '';
      case 'deathDate':
        if (!value) return '';
        if (typeof value !== 'string') return 'Invalid date format';
        if (!isDateValid(value)) return 'Invalid date format (use YYYY-MM-DD)';
        
        const death = new Date(value);
        if (!formValues.dateOfBirth) return 'Date of birth must be set first';
        
        const birth = new Date(formValues.dateOfBirth);
        if (death < birth) return 'Death date must be after birth date';
        
        const now = new Date();
        if (death > now) return 'Death date cannot be in the future';
        return '';
      case 'occupation':
        if (typeof value !== 'string' || !value.trim()) return 'Occupation is required';
        return '';
      default:
        return '';
    }
  };

  const handleChange = <K extends keyof PatientFormValues>(field: K, value: PatientFormValues[K]) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when field changes
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBlur = (field: keyof PatientFormValues) => {
    const error = validateField(field);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    (Object.keys(formValues) as (keyof PatientFormValues)[]).forEach(field => {
      if (field === 'deathDate' && !formValues.deathDate) return;
      
      const error = validateField(field);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    
    if (isValid) {
      onSubmit({
        ...formValues,
        name: formValues.name.trim(),
        occupation: formValues.occupation.trim(),
        ssn: formValues.ssn ? formValues.ssn.trim() : '',
        deathDate: formValues.deathDate || null
      });
    }
  };

  return {
    formValues,
    errors,
    formError,
    handleChange,
    handleBlur,
    handleSubmit
  };
};

export default usePatientForm;