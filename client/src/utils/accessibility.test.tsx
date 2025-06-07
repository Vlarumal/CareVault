import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { test, expect, vi } from 'vitest';
import * as axe from 'axe-core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PatientPage from '../components/PatientPage';
import * as patientService from '../services/patients';
import * as diagnosisService from '../services/diagnoses';
import { Patient } from '../types';
import { Gender } from '@shared/src/types/medicalTypes';

test('Homepage should have no accessibility violations', async () => {
  const queryClient = new QueryClient();
  const { container } = render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
  const results = await axe.run(container);
  expect(results.violations).toHaveLength(0);
});

test('PatientPage should have no accessibility violations', async () => {
  const queryClient = new QueryClient();
  const mockPatient: Patient = {
    id: '1',
    name: 'John Doe',
    ssn: '123-45-6789',
    occupation: 'Developer',
    gender: Gender.Male,
    dateOfBirth: '1990-01-01',
    entries: []
  };
  
  // Mock service calls
  vi.spyOn(patientService, 'getById').mockResolvedValue(mockPatient);
  vi.spyOn(diagnosisService, 'getAllDiagnoses').mockResolvedValue([]);
  
  const { container } = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/patients/1']}>
        <PatientPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
  
  const results = await axe.run(container);
  expect(results.violations).toHaveLength(0);
});
