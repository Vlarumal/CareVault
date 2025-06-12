import { test, expect } from 'vitest';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import PatientListPage from './index';

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

test('simple test for PatientListPage', async () => {
  render(
    <TestWrapper>
      <PatientListPage />
    </TestWrapper>
  );
  
  expect(await screen.findByText('Loading...')).toBeInTheDocument();
  
  await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
});