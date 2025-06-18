import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Mock, afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest';
import axios from 'axios';
import App from './App';
import patientService from './services/patients';
import authService from './services/auth';
import { Gender, Patient } from './types';
import { apiBaseUrl } from './constants';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('./services/patients');
vi.mock('./services/auth');
vi.mock('axios');

const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'John Doe',
    dateOfBirth: '1980-01-01',
    ssn: '123456-6789',
    gender: Gender.Male,
    occupation: 'Engineer',
    entries: []
  },
  {
    id: '2',
    name: 'Jane Smith',
    dateOfBirth: '1990-02-02',
    ssn: '987650-4321',
    gender: Gender.Female,
    occupation: 'Designer',
    entries: []
  }
];

const queryClient = new QueryClient();

describe('App', () => {
  beforeEach(() => {
    (axios.get as Mock).mockResolvedValue({});
    
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

  describe('Logout functionality', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test-token');
    });

    afterEach(() => {
      localStorage.clear();
      sessionStorage.clear();
      vi.clearAllMocks();
    });

    it('clears auth state and redirects to login on successful logout', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );

      expect(await screen.findByText('Logout')).toBeInTheDocument();

      vi.spyOn(authService, 'logout').mockResolvedValue();

      fireEvent.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBeNull();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
      });
    });

    it('clears auth state even when logout API fails', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );

      vi.spyOn(authService, 'logout').mockRejectedValue(new Error('API error'));

      fireEvent.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBeNull();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
      });
    });

    it('clears query cache on logout', async () => {
      queryClient.setQueryData(['patients'], mockPatients);
      
      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );

      vi.spyOn(authService, 'logout').mockResolvedValue();

      fireEvent.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(queryClient.getQueryData(['patients'])).toBeUndefined();
      });
    });
  });
});
