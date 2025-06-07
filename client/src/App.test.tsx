import { render, screen, waitFor } from '@testing-library/react';
import { Mock, afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import axios from 'axios';
import App from './App';
import patientService from './services/patients';
import { Gender, Patient } from './types';
import { apiBaseUrl } from './constants';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock API calls
vi.mock('./services/patients');
vi.mock('axios');

const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'John Doe',
    dateOfBirth: '1980-01-01',
    ssn: '123-45-6789',
    gender: Gender.Male,
    occupation: 'Engineer',
    entries: []
  },
  {
    id: '2',
    name: 'Jane Smith',
    dateOfBirth: '1990-02-02',
    ssn: '987-65-4321',
    gender: Gender.Female,
    occupation: 'Designer',
    entries: []
  }
];

const queryClient = new QueryClient();

describe('App', () => {
  beforeEach(() => {
    // Mock axios ping check
    (axios.get as Mock).mockResolvedValue({});
    
    // Mock patient service
    (patientService.getAll as Mock).mockResolvedValue(mockPatients);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders CareVault title', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('CareVault')).toBeInTheDocument();
    });
  });

  test('renders Home button', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      const homeButton = screen.getByText('Home');
      expect(homeButton).toBeInTheDocument();
      expect(homeButton).toHaveAttribute('href', '/');
    });
  });

  test('fetches and displays patient list', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(patientService.getAll).toHaveBeenCalledTimes(1);
    });
    
    // Verify patient names are displayed
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(await screen.findByText('Jane Smith')).toBeInTheDocument();
  });

test('renders patient links with correct hrefs', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(patientService.getAll).toHaveBeenCalledTimes(1);
    });
    
    // Verify patient links contain correct href
    const johnLink = await screen.findByText('John Doe');
    expect(johnLink).toHaveAttribute('href', '/1');
    
    const janeLink = await screen.findByText('Jane Smith');
    expect(janeLink).toHaveAttribute('href', '/2');
  });

  test('handles API ping failure', async () => {
    (axios.get as Mock).mockRejectedValue(new Error('Network error'));
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(`${apiBaseUrl}/ping`);
      expect(screen.getByText('Error connecting to backend')).toBeInTheDocument();
    });
  });

  test('displays empty state when no patients', async () => {
    (patientService.getAll as Mock).mockResolvedValue([]);
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('No patients found')).toBeInTheDocument();
    });
  });
});
