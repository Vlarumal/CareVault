import { useState, useRef } from 'react';
import { DiagnosisEntry, NewEntryFormValues } from '../types';
import { AxiosError } from 'axios';

interface UseEntryFormProps {
  mode: 'add' | 'edit';
  patientId: string;
  entryId?: string;
  initialValues?: NewEntryFormValues;
  onSuccess: (values: NewEntryFormValues) => void;
  diagnosisCodes?: DiagnosisEntry[];
  onSubmit: (values: NewEntryFormValues) => Promise<void>; // Added callback
}

interface UseEntryFormReturn {
  formValues: NewEntryFormValues;
  error: string | undefined;
  loading: boolean;
  errors: Record<string, string>;
  handleChange: <K extends keyof NewEntryFormValues>(
    field: K,
    value: NewEntryFormValues[K]
  ) => void;
  handleSubmit: () => Promise<void>;
  handleReasonChange: (reason: string) => void;
}

const useEntryForm = ({
  mode,
  entryId,
  initialValues,
  onSuccess,
  diagnosisCodes: _diagnosisCodes, // Mark as unused
  onSubmit,
}: UseEntryFormProps): UseEntryFormReturn => {
  const [formValues, setFormValues] = useState<NewEntryFormValues>(
    initialValues || {
      description: '',
      date: '',
      specialist: '',
      type: 'HealthCheck',
      updatedAt: new Date().toISOString(),
      changeReason: '',
      version: 0,
    }
  );
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isSubmittingRef = useRef(false);

  const handleChange = <K extends keyof NewEntryFormValues>(
    field: K,
    value: NewEntryFormValues[K]
  ) => {
    if (field === 'diagnosisCodes' && Array.isArray(value)) {
      value = value.filter(code => code !== null) as NewEntryFormValues[K];
    }
    
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (loading || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    
    try {
      setLoading(true);
      setErrors({});

      if (mode === 'edit' && entryId) {
        if (!changeReason || changeReason.trim().length < 10) {
          setErrors({ changeReason: 'Change reason must be at least 10 characters' });
          setLoading(false);
          return;
        }
      }

      const submissionData = {
        ...formValues,
        updatedAt: formValues.updatedAt || new Date().toISOString(),
        ...(mode === 'edit' && entryId ? { changeReason } : {})
      };

      await onSubmit(submissionData); // Delegate to parent
      onSuccess(submissionData);
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        if (e.response?.data.error === 'INVALID_CHANGE_REASON') {
          setErrors({ changeReason: e.response.data.message });
        }
        else if (e.response?.data.error === 'VERSION_CONFLICT') {
          setError('This entry has been modified by another user. Please refresh and try again.');
        }
        else {
          setError(e.response?.data.error || e.message);
        }
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return {
    formValues,
    error,
    loading,
    errors,
    handleChange,
    handleSubmit,
    handleReasonChange: setChangeReason,
  };
};

export default useEntryForm;
