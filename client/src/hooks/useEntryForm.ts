import { useState } from 'react';
import { DiagnosisEntry, NewEntryFormValues } from '../types';
import patientsService from '../services/patients';
import { AxiosError } from 'axios';

interface UseEntryFormProps {
  mode: 'add' | 'edit';
  patientId: string;
  entryId?: string;
  initialValues?: NewEntryFormValues;
  onSuccess: () => void;
  diagnosisCodes?: DiagnosisEntry[]; // Optional and unused
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
  handleLastUpdatedChange: (date: string) => void;
}

const useEntryForm = ({
  mode,
  patientId,
  entryId,
  initialValues,
  onSuccess,
  diagnosisCodes: _diagnosisCodes, // Mark as unused
}: UseEntryFormProps): UseEntryFormReturn => {
  const [formValues, setFormValues] = useState<NewEntryFormValues>(
    initialValues || {
      description: '',
      date: '',
      specialist: '',
      type: 'HealthCheck',
      lastUpdated: new Date().toISOString(),
      changeReason: '',
    }
  );
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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

      if (mode === 'edit' && entryId) {
        await patientsService.updateEntry(
          patientId,
          entryId,
          formValues
        );
      } else {
        await patientsService.createNewEntry(patientId, formValues);
      }

      onSuccess();
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        if (e.response?.data.error === 'INVALID_CHANGE_REASON') {
          setErrors({ changeReason: e.response.data.message });
        } else {
          setError(e.response?.data.error || e.message);
        }
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
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
    handleLastUpdatedChange: (date: string) => {
      setFormValues((prev) => ({
        ...prev,
        lastUpdated: date,
      }));
    },
  };
};

export default useEntryForm;
