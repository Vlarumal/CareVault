import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import axios from 'axios';
import App from './App';
import patientService from './services/patients';
import { Gender, Patient } from './types';

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

describe('App', () => {
  beforeEach(() => {
    // Mock axios ping check
    (axios.get as jest.Mock).mockResolvedValue({});
    
    // Mock patient service
    (patientService.getAll as jest.Mock).mockResolvedValue(mockPatients);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders Patientor title', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Patientor')).toBeInTheDocument();
    });
  });

  test('renders Home button', async () => {
    render(<App />);
    
    await waitFor(() => {
      const homeButton = screen.getByText('Home');
      expect(homeButton).toBeInTheDocument();
      expect(homeButton).toHaveAttribute('href', '/');
    });
  });

  test('fetches and displays patient list', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(patientService.getAll).toHaveBeenCalledTimes(1);
    });
    
    // Verify patient names are displayed
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(await screen.findByText('Jane Smith')).toBeInTheDocument();
  });

  test('renders patient links with correct hrefs', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(patientService.getAll).toHaveBeenCalledTimes(1);
    });
    
    // Verify patient links contain correct href
    const johnLink = await screen.findByText('John Doe');
    expect(johnLink).toHaveAttribute('href', '/1');
    
    const janeLink = await screen.findByText('Jane Smith');
    expect(janeLink).toHaveAttribute('href', '/2');
  });
});
