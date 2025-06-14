import { test, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import PatientListPage from './index';
import patientsService from '../../services/patients';

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

afterEach(() => {
  vi.restoreAllMocks();
});

test('simple test for PatientListPage', async () => {
  // Mock API call to return delayed promise
  vi.spyOn(patientsService, 'getAll').mockImplementation(() => {
    return new Promise(() => {}); // Never resolves to keep in loading state
  });

  render(
    <TestWrapper>
      <PatientListPage />
    </TestWrapper>
  );
  
  // Verify skeleton loaders appear
  const skeletons = await screen.findAllByTestId('patient-skeleton');
  expect(skeletons.length).toBeGreaterThan(0);
  
  // Clean up mock to avoid affecting other tests
  vi.restoreAllMocks();
});